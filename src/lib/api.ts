/**
 * Cliente da API.
 *
 * Toda chamada vai para `/api/...` na própria origem do painel; o Next repassa
 * para a API (rewrites em next.config.mjs, ADR-0004). É isso que deixa o
 * cookie de renovação funcionar com a API em outro domínio.
 *
 * Decisões que valem manter (ver docs/decisoes/ADR-0002):
 *  - o access token vive EM MEMÓRIA, nunca em localStorage. Se um XSS acontecer,
 *    não há token parado no disco do navegador para ser roubado;
 *  - o refresh token é um cookie httpOnly que este código nem consegue ler —
 *    por isso todo fetch vai com `credentials: 'include'`;
 *  - quando a API responde 401, tentamos renovar uma vez e repetir a chamada;
 *    se nem a renovação passa, a sessão acabou e quem estiver ouvindo
 *    `aoPerderSessao` (o layout logado) manda para o login.
 */
let accessToken: string | null = null;
export const guardarToken = (t: string | null) => { accessToken = t; };

const SEM_SERVIDOR = 'Não foi possível falar com o servidor. Confira a internet e tente de novo.';

let aoPerder: (() => void) | null = null;
/** Quem chama é avisado quando a sessão cai de vez (401 que nem a renovação resolve). */
export function aoPerderSessao(funcao: (() => void) | null) {
  aoPerder = funcao;
}

class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

async function chamar<T>(caminho: string, init: RequestInit = {}, jaRenovou = false): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch só lança sem resposta nenhuma: rede caída ou servidor fora do ar.
    // O "Failed to fetch" do navegador não diz nada para quem usa.
    throw new ErroApi(0, SEM_SERVIDOR);
  }

  // Login e renovação respondem 401 por conta própria (senha errada, cookie
  // vencido): renovar aí não faz sentido.
  const rotaDeEntrada = caminho.startsWith('/auth/');
  if (resposta.status === 401 && !jaRenovou && !rotaDeEntrada) {
    const renovado = await renovar();
    if (renovado) return chamar<T>(caminho, init, true);
    aoPerder?.();
  }

  // Erro do proxy do Next com a API fora do ar chega sem corpo JSON.
  if (resposta.status === 502 || resposta.status === 503 || resposta.status === 504) {
    throw new ErroApi(resposta.status, SEM_SERVIDOR);
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    const padrao = resposta.status >= 500
      ? 'O servidor não conseguiu concluir a operação. Tente de novo em instantes.'
      : 'Não foi possível concluir a operação.';
    throw new ErroApi(resposta.status, corpo.message ?? padrao);
  }

  return resposta.status === 204 ? (undefined as T) : resposta.json();
}

let renovando: Promise<boolean> | null = null;

/**
 * Uma renovação por vez: a tela que dispara várias chamadas juntas recebe
 * vários 401 juntos, e todos esperam a mesma renovação.
 */
function renovar(): Promise<boolean> {
  renovando ??= chamar<{ accessToken: string }>('/auth/renovar', { method: 'POST' }, true)
    .then(({ accessToken: novo }) => {
      guardarToken(novo);
      return true;
    })
    .catch(() => {
      guardarToken(null);
      return false;
    })
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

/**
 * Há sessão? Com o token em memória, sim. Sem ele (página recarregada, aba
 * nova), tenta renovar pelo cookie. É o que a guarda do layout logado usa.
 */
export async function garantirSessao(): Promise<boolean> {
  return accessToken !== null || renovar();
}

export const api = {
  get: <T>(caminho: string) => chamar<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    chamar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo ?? {}) }),
  put: <T>(caminho: string, corpo: unknown) =>
    chamar<T>(caminho, { method: 'PUT', body: JSON.stringify(corpo) }),
  delete: <T = void>(caminho: string) => chamar<T>(caminho, { method: 'DELETE' }),
};

export { ErroApi };
