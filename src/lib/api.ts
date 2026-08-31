/**
 * Cliente da API.
 *
 * Decisões que valem manter (ver docs/decisoes/ADR-0002):
 *  - o access token vive EM MEMÓRIA, nunca em localStorage. Se um XSS acontecer,
 *    não há token parado no disco do navegador para ser roubado;
 *  - o refresh token é um cookie httpOnly que este código nem consegue ler —
 *    por isso todo fetch vai com `credentials: 'include'`;
 *  - quando a API responde 401, tentamos renovar uma vez e repetir a chamada.
 */
const URL_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

let accessToken: string | null = null;
export const guardarToken = (t: string | null) => { accessToken = t; };

class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

async function chamar<T>(caminho: string, init: RequestInit = {}, jaRenovou = false): Promise<T> {
  const resposta = await fetch(`${URL_API}/api${caminho}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (resposta.status === 401 && !jaRenovou && caminho !== '/auth/renovar') {
    const renovado = await renovar();
    if (renovado) return chamar<T>(caminho, init, true);
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ErroApi(resposta.status, corpo.message ?? 'Não foi possível concluir a operação.');
  }

  return resposta.status === 204 ? (undefined as T) : resposta.json();
}

async function renovar(): Promise<boolean> {
  try {
    const { accessToken: novo } = await chamar<{ accessToken: string }>(
      '/auth/renovar', { method: 'POST' }, true,
    );
    guardarToken(novo);
    return true;
  } catch {
    guardarToken(null);
    return false;
  }
}

export const api = {
  get: <T>(caminho: string) => chamar<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    chamar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo ?? {}) }),
  patch: <T>(caminho: string, corpo: unknown) =>
    chamar<T>(caminho, { method: 'PATCH', body: JSON.stringify(corpo) }),
};

export { ErroApi };
