import { api, ErroApi } from './api';
import type { Municipio } from '@/tipos/dominio';

/**
 * Municípios a partir do IBGE.
 *
 * A usuária escolhe UF e município na lista oficial do IBGE (dado público,
 * chamado direto do navegador: não passa pela nossa API nem leva cookie). Na
 * hora de gravar, `garantirMunicipio` traduz a escolha para o município do
 * nosso banco, criando-o se for a primeira comunidade dele. Assim não existe
 * tela de "cadastrar município" e o `codigoIbge`, que o mapa usa para buscar o
 * contorno do município (ADR-0005), já nasce preenchido.
 */

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

const IBGE_FORA = 'Não foi possível carregar a lista do IBGE. Confira a internet e tente de novo.';

export interface UfIbge {
  id: number;
  sigla: string;
  nome: string;
}

export interface MunicipioIbge {
  /** Código IBGE de 7 dígitos. */
  id: number;
  nome: string;
}

async function buscarIbge<T>(caminho: string, sinal?: AbortSignal): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${IBGE}${caminho}`, { signal: sinal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error(IBGE_FORA);
  }
  if (!resposta.ok) throw new Error(IBGE_FORA);
  return resposta.json();
}

export const listarUfs = (sinal?: AbortSignal) =>
  buscarIbge<UfIbge[]>('/estados?orderBy=nome', sinal);

export const listarMunicipiosIbge = (uf: string, sinal?: AbortSignal) =>
  buscarIbge<MunicipioIbge[]>(`/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`, sinal);

/** "São José do Egito" e "sao jose do egito" são o mesmo município. */
const chave = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

function procurar(lista: Municipio[], codigo: string, nome: string, uf: string) {
  return lista.find((m) => m.codigoIbge === codigo)
    // Município cadastrado antes, sem código (Swagger, script de semente).
    ?? lista.find((m) => !m.codigoIbge && m.uf.toUpperCase() === uf && chave(m.nome) === chave(nome));
}

/**
 * Devolve o município do nosso banco que corresponde à escolha no IBGE,
 * criando-o (`POST /api/municipios`) se ainda não existir.
 */
export async function garantirMunicipio(escolhido: MunicipioIbge, uf: string): Promise<Municipio> {
  const codigoIbge = String(escolhido.id);
  const dados = { nome: escolhido.nome, uf, codigoIbge };

  const existente = procurar(await api.get<Municipio[]>('/municipios'), codigoIbge, escolhido.nome, uf);
  if (existente) {
    if (existente.codigoIbge) return existente;
    // Achou pelo nome: aproveita para gravar o código que faltava.
    return api.put<Municipio>(`/municipios/${existente.id}`, dados);
  }

  try {
    return await api.post<Municipio>('/municipios', dados);
  } catch (falha) {
    // 409: outra aba criou o mesmo município entre a busca e o POST.
    if (falha instanceof ErroApi && falha.status === 409) {
      const criado = procurar(await api.get<Municipio[]>('/municipios'), codigoIbge, escolhido.nome, uf);
      if (criado) return criado;
    }
    throw falha;
  }
}
