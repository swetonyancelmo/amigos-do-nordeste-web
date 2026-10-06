import { chave } from './municipios';

/**
 * Sugestão de posição pelo nome da comunidade, no Nominatim (OpenStreetMap).
 *
 * Política de uso (https://operations.osmfoundation.org/policies/nominatim/):
 * no máximo 1 busca por segundo, sem autocompletar e com cache. Por isso só
 * se busca ao clicar em "Procurar no mapa", as buscas fazem fila com 1 s de
 * intervalo e a mesma pergunta não sai duas vezes. O navegador já manda o
 * Referer que a política pede.
 *
 * Só vai para fora o nome da comunidade, o município e a UF (dado público).
 * Nenhum dado de família passa por aqui.
 *
 * Acha povoados e distritos; sítio pequeno quase nunca está no OSM. O
 * resultado é só sugestão: vira coordenada quando a usuária confirma.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const INTERVALO_MS = 1000;

const FORA = 'Não foi possível procurar agora. Confira a internet ou marque no mapa.';

/** Tipos que são o próprio município (ou maior), não uma comunidade dele. */
const AMPLOS = new Set(['municipality', 'city', 'county', 'state_district', 'state', 'region', 'country']);

export interface LugarEncontrado {
  latitude: number;
  longitude: number;
  /** Nome completo devolvido pelo OSM ("Algodões, Sertânia, Pernambuco…"). */
  descricao: string;
}

/** Retângulo do município, em graus, para a busca não sair dele. */
export interface Limites {
  oeste: number;
  sul: number;
  leste: number;
  norte: number;
}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  name: string;
  category: string;
  addresstype: string;
  display_name: string;
}

/** Horário reservado para a última busca; as seguintes entram na fila depois dele. */
let ultimaBusca = 0;
const memoria = new Map<string, LugarEncontrado | null>();

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

/**
 * O Nominatim casa por palavra e pode responder com algo de outro município
 * ("Rio da Barra, Ibimirim" já devolveu uma estrada de Sertânia) ou com o
 * próprio município quando a comunidade tem o nome dele, o que poria o pino
 * na sede. Fica só o que está no município pedido e não é ele mesmo.
 *
 * Entre os que sobram, o núcleo de casas (`place`: vila, povoado, lugarejo)
 * vem antes da área administrativa (`boundary`). "Algodões, Sertânia" devolve
 * o distrito primeiro, e o ponto dele é o centro de uma área grande, a uns
 * 6,5 km da vila onde as pessoas moram.
 */
function escolher(resultados: ResultadoNominatim[], municipio: string): LugarEncontrado | null {
  const nomeMunicipio = chave(municipio);
  const candidatos = resultados.filter((r) =>
    r.category !== 'highway'
    && !AMPLOS.has(r.addresstype)
    && chave(r.name ?? '') !== nomeMunicipio
    && chave(r.display_name).split(',').map((parte) => parte.trim()).includes(nomeMunicipio));
  const lugar = candidatos.find((r) => r.category === 'place') ?? candidatos[0];
  if (!lugar) return null;
  return { latitude: Number(lugar.lat), longitude: Number(lugar.lon), descricao: lugar.display_name };
}

/** Devolve a sugestão, ou `null` quando o OSM não conhece a comunidade. */
export async function procurarComunidade(
  { nome, municipio, uf, limites }: { nome: string; municipio: string; uf: string; limites?: Limites | null },
  sinal?: AbortSignal,
): Promise<LugarEncontrado | null> {
  const pergunta = `${nome.trim()}, ${municipio}, ${uf}`;
  const parametros = new URLSearchParams({
    q: pergunta,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'br',
    'accept-language': 'pt-BR',
  });
  if (limites) {
    parametros.set('viewbox', [limites.oeste, limites.norte, limites.leste, limites.sul].join(','));
    parametros.set('bounded', '1');
  }
  const url = `${NOMINATIM}?${parametros}`;
  if (memoria.has(url)) return memoria.get(url) ?? null;

  const agora = Date.now();
  const vez = Math.max(agora, ultimaBusca + INTERVALO_MS);
  ultimaBusca = vez;
  if (vez > agora) await esperar(vez - agora);
  sinal?.throwIfAborted();

  let resposta: Response;
  try {
    resposta = await fetch(url, { signal: sinal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error(FORA);
  }
  if (!resposta.ok) throw new Error(FORA);

  const lugar = escolher(await resposta.json(), municipio);
  memoria.set(url, lugar);
  return lugar;
}
