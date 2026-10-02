'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Modal } from '@/componentes/Modal';
import { api } from '@/lib/api';
import { useMetadados } from '@/lib/metadados';
import type { Familia, Opcao, Pessoa } from '@/tipos/dominio';
import styles from './familias.module.css';

/** Um item de `GET /api/familias`. */
interface ItemFamilia {
  id: string;
  responsavelNome: string;
  comunidadeId: string;
  comunidadeNome: string;
  municipioNome: string;
  ativa: boolean;
  semBanheiro: boolean;
  totalPessoas: number;
  totalAte12Anos: number;
  totalDe13A59Anos: number;
  total60AnosOuMais: number;
  totalSemIdadeConhecida: number;
}

interface RespostaFamilias {
  itens: ItemFamilia[];
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
}

interface ComunidadeResumo {
  id: string;
  nome: string;
}

// A ficha pode trazer campos que ainda não estão em `dominio.ts`.
type FichaFamilia = Familia & { observacoes?: string | null; ativa?: boolean };
type PessoaFicha = Pessoa & { observacoes?: string | null };

const POR_PAGINA = 25;

// Fora do componente: JSX estável, o cabeçalho não re-renderiza à toa.
const ACOES = (
  <Link href="/cadastro-familia/nova" className="botao botao--primario">
    + Nova família
  </Link>
);

/* ------------------------------------------------------------- utilitários */

const formatarNumero = (n: number) => n.toLocaleString('pt-BR');

/** A API pode devolver uma lista pura ou um objeto paginado com `itens`. */
function comoLista<T>(dado: unknown): T[] {
  if (Array.isArray(dado)) return dado as T[];
  const itens = (dado as { itens?: unknown } | null)?.itens;
  return Array.isArray(itens) ? (itens as T[]) : [];
}

// "OUTRO_PARENTE" -> "Outro parente" (usado quando a API não manda rótulo)
function formatarEnum(valor: string) {
  const texto = valor.toLowerCase().replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function rotuloDe(lista: Opcao[] | undefined, valor: string | null | undefined) {
  if (!valor) return '—';
  return lista?.find((o) => o.valor === valor)?.rotulo ?? formatarEnum(valor);
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function calcularIdade(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
    idade -= 1;
  }
  return idade;
}

function exibirIdade(pessoa: PessoaFicha) {
  if (pessoa.dataNascimento) {
    return `${formatarData(pessoa.dataNascimento)} (${calcularIdade(pessoa.dataNascimento)} anos)`;
  }
  return pessoa.idadeEstimada != null ? `${pessoa.idadeEstimada} anos (estimada)` : '—';
}

/** Números das páginas (começam em 0) com reticências: 1 2 3 … 315 */
function paginasVisiveis(atual: number, total: number): (number | 'reticencias')[] {
  const conjunto = new Set(
    [0, total - 1, atual - 1, atual, atual + 1].filter((n) => n >= 0 && n < total),
  );
  const ordenadas = [...conjunto].sort((a, b) => a - b);
  const saida: (number | 'reticencias')[] = [];
  ordenadas.forEach((n, i) => {
    if (i > 0 && n - ordenadas[i - 1] > 1) saida.push('reticencias');
    saida.push(n);
  });
  return saida;
}

const mensagemDeErro = (e: unknown, padrao: string) => (e instanceof Error ? e.message : padrao);

function IconeBusca() {
  return (
    <svg
      className={styles.buscaIcone}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ ficha */

function Dado({ rotulo, children, larga }: { rotulo: string; children: React.ReactNode; larga?: boolean }) {
  return (
    <div className={larga ? styles.larga : undefined}>
      <dt>{rotulo}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

/** Tudo o que está cadastrado da família: carrega a ficha ao abrir o modal. */
function DetalhesFamilia({ item }: { item: ItemFamilia }) {
  const { metadados } = useMetadados();
  const [ficha, setFicha] = useState<FichaFamilia | null>(null);
  const [pessoas, setPessoas] = useState<PessoaFicha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    Promise.all([
      api.get<FichaFamilia>(`/familias/${item.id}`),
      api.get<unknown>(`/familias/${item.id}/pessoas`).catch(() => null),
    ])
      .then(([dadosFicha, dadosPessoas]) => {
        if (!ativo) return;
        const daRota = dadosPessoas === null ? [] : comoLista<PessoaFicha>(dadosPessoas);
        setFicha(dadosFicha);
        setPessoas(daRota.length > 0 ? daRota : (dadosFicha.pessoas ?? []));
      })
      .catch((e) => ativo && setErro(mensagemDeErro(e, 'Não foi possível carregar a família.')))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [item.id]);

  if (carregando) return <p className={styles.estado}>Carregando…</p>;
  if (erro || !ficha) return <Aviso tom="erro">{erro || 'Família não encontrada.'}</Aviso>;

  const listaParentesco = (metadados as unknown as Record<string, Opcao[] | undefined> | null)?.parentesco;
  const totais = ficha.totais ?? {
    totalPessoas: item.totalPessoas,
    ate12: item.totalAte12Anos,
    de13a59: item.totalDe13A59Anos,
    de60ouMais: item.total60AnosOuMais,
    semIdadeInformada: item.totalSemIdadeConhecida,
  };
  const rendas = ficha.fontesRenda ?? [];
  const ativa = ficha.ativa ?? item.ativa;
  const semBanheiro = ficha.temBanheiro === null ? item.semBanheiro : ficha.temBanheiro === false;

  return (
    <>
      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Família</h3>
        <dl className={styles.grade}>
          <Dado rotulo="Responsável">{ficha.responsavelNome}</Dado>
          <Dado rotulo="CPF">{ficha.responsavelCpf}</Dado>
          <Dado rotulo="Telefone">{ficha.telefone}</Dado>
          <Dado rotulo="Situação">{ativa ? 'Ativa' : 'Inativa'}</Dado>
          <Dado rotulo="Comunidade">{item.comunidadeNome}</Dado>
          <Dado rotulo="Município">{item.municipioNome}</Dado>
          <Dado rotulo="Ponto de referência" larga>
            {ficha.pontoReferencia}
          </Dado>
          {ficha.observacoes && (
            <Dado rotulo="Observações" larga>
              {ficha.observacoes}
            </Dado>
          )}
        </dl>
      </section>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Moradia</h3>
        <dl className={styles.grade}>
          <Dado rotulo="Abastecimento de água">
            {ficha.abastecimentoAgua?.length
              ? ficha.abastecimentoAgua.map((v) => rotuloDe(metadados?.abastecimentoAgua, v)).join(', ')
              : ''}
          </Dado>
          <Dado rotulo="Tratamento da água">{rotuloDe(metadados?.tratamentoAgua, ficha.tratamentoAgua)}</Dado>
          <Dado rotulo="Tem banheiro">
            {ficha.temBanheiro === null ? 'Não informado' : ficha.temBanheiro ? 'Sim' : 'Não'}
            {semBanheiro && ficha.temBanheiro === null ? ' (tratada como sem banheiro)' : ''}
          </Dado>
          <Dado rotulo="Escoamento sanitário">
            {rotuloDe(metadados?.escoamentoSanitario, ficha.escoamentoSanitario)}
          </Dado>
        </dl>
      </section>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Totais</h3>
        <div className={styles.totais}>
          {[
            ['Pessoas', totais.totalPessoas],
            ['Até 12 anos', totais.ate12],
            ['13 a 59 anos', totais.de13a59],
            ['60 anos ou mais', totais.de60ouMais],
            ['Sem idade', totais.semIdadeInformada],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className={styles.totalCaixa}>
              <span className={styles.totalNumero}>{valor}</span>
              <span className={styles.totalRotulo}>{rotulo}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Pessoas ({pessoas.length})</h3>
        {pessoas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma pessoa cadastrada.</p>
        ) : (
          <div className={styles.lista}>
            {pessoas.map((pessoa) => (
              <article key={pessoa.id} className={styles.cartao}>
                <div className={styles.cartaoTopo}>
                  <span className={styles.cartaoNome}>{pessoa.nome}</span>
                  <div className={styles.badges}>
                    {pessoa.cadastroIncompleto && <span className={`${styles.tag} ${styles.tagIncompleto}`}>Incompleto</span>}
                    {pessoa.estuda && <span className={`${styles.tag} ${styles.tagEstuda}`}>Estuda</span>}
                    {pessoa.gestante && <span className={`${styles.tag} ${styles.tagGestante}`}>Gestante</span>}
                  </div>
                </div>
                <dl className={styles.grade}>
                  <Dado rotulo="Parentesco">{rotuloDe(listaParentesco, pessoa.parentesco)}</Dado>
                  <Dado rotulo="Sexo">{rotuloDe(metadados?.sexo, pessoa.sexo)}</Dado>
                  <Dado rotulo="Nascimento / idade">{exibirIdade(pessoa)}</Dado>
                  <Dado rotulo="Série">{pessoa.estuda ? rotuloDe(metadados?.serie, pessoa.serie) : 'Não estuda'}</Dado>
                  <Dado rotulo="Tamanho da roupa">{rotuloDe(metadados?.tamanhoRoupa, pessoa.tamanhoRoupa)}</Dado>
                  <Dado rotulo="Número do calçado">{pessoa.numeroCalcado}</Dado>
                  {pessoa.observacoes && (
                    <Dado rotulo="Observações" larga>
                      {pessoa.observacoes}
                    </Dado>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Fontes de renda ({rendas.length})</h3>
        {rendas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma fonte de renda cadastrada.</p>
        ) : (
          <div className={styles.lista}>
            {rendas.map((renda) => (
              <article key={renda.id} className={styles.cartao}>
                <dl className={styles.grade}>
                  <Dado rotulo="Tipo">{rotuloDe(metadados?.tipoFonteRenda, renda.tipo)}</Dado>
                  <Dado rotulo="Quem recebe">
                    {pessoas.find((p) => p.id === renda.pessoaId)?.nome ?? ''}
                  </Dado>
                  <Dado rotulo="Faixa">{rotuloDe(metadados?.faixaRenda, renda.faixa)}</Dado>
                  <Dado rotulo="Observação">{renda.observacao}</Dado>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* ----------------------------------------------------------------- página */

/**
 * Lista de famílias (tela 02 do Figma).
 *  - a busca é pelo nome da responsável (a API ignora acento);
 *  - os totais de cada linha vêm calculados da API;
 *  - paginação simples, sem scroll infinito.
 */
export default function Familias() {
  useCabecalho('Famílias', ACOES);

  const [digitado, setDigitado] = useState('');
  const [busca, setBusca] = useState('');
  const [comunidadeId, setComunidadeId] = useState('');
  const [semBanheiro, setSemBanheiro] = useState(false);
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [pagina, setPagina] = useState(0);

  const [resposta, setResposta] = useState<RespostaFamilias | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [comunidades, setComunidades] = useState<ComunidadeResumo[]>([]);
  const [selecionada, setSelecionada] = useState<ItemFamilia | null>(null);
  const ultimaRequisicao = useRef(0);

  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const espera = setTimeout(() => {
      setBusca(digitado.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(espera);
  }, [digitado]);

  // Comunidades para os chips de filtro
  useEffect(() => {
    api
      .get<unknown>('/comunidades')
      .then((dado) => setComunidades(comoLista<ComunidadeResumo>(dado)))
      .catch(() => setComunidades([]));
  }, []);

  // Lista de famílias
  useEffect(() => {
    const requisicao = ++ultimaRequisicao.current;
    const atual = () => requisicao === ultimaRequisicao.current; // ignora resposta atrasada

    const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
    if (busca) params.set('busca', busca);
    if (comunidadeId) params.set('comunidadeId', comunidadeId);
    if (semBanheiro) params.set('semBanheiro', 'true');
    if (incluirInativas) params.set('incluirInativas', 'true');

    setCarregando(true);
    setErro('');
    api
      .get<RespostaFamilias>(`/familias?${params}`)
      .then((dado) => atual() && setResposta(dado))
      .catch((e) => atual() && setErro(mensagemDeErro(e, 'Não foi possível carregar as famílias.')))
      .finally(() => atual() && setCarregando(false));
  }, [busca, comunidadeId, semBanheiro, incluirInativas, pagina]);

  const fecharModal = useCallback(() => setSelecionada(null), []);

  const escolherComunidade = (id: string) => {
    setComunidadeId(id);
    setPagina(0);
  };
  const alternarSemBanheiro = () => {
    setSemBanheiro((v) => !v);
    setPagina(0);
  };
  const alternarInativas = () => {
    setIncluirInativas((v) => !v);
    setPagina(0);
  };

  const itens = resposta?.itens ?? [];
  const total = resposta?.total ?? 0;
  const totalPaginas = resposta?.totalPaginas ?? 0;

  return (
    <main className={`${styles.pagina} pagina-pessoas`}>
      <section className={styles.conteudo}>
        <p className={styles.resumo}>
          {resposta ? `${formatarNumero(total)} ${total === 1 ? 'família' : 'famílias'}` : 'Carregando famílias…'}
        </p>

        <div className={styles.busca}>
          <IconeBusca />
          <input
            className={styles.buscaEntrada}
            type="search"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            placeholder="Buscar pelo nome da responsável…"
            aria-label="Buscar pelo nome da responsável"
          />
        </div>

        <div className={styles.chips} role="group" aria-label="Filtros">
          <button
            type="button"
            className={`${styles.chip} ${comunidadeId === '' ? styles.chipAtivo : ''}`}
            aria-pressed={comunidadeId === ''}
            onClick={() => escolherComunidade('')}
          >
            Todas as comunidades
          </button>
          {comunidades.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.chip} ${comunidadeId === c.id ? styles.chipAtivo : ''}`}
              aria-pressed={comunidadeId === c.id}
              onClick={() => escolherComunidade(c.id)}
            >
              {c.nome}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.chip} ${semBanheiro ? styles.chipAtivo : ''}`}
            aria-pressed={semBanheiro}
            onClick={alternarSemBanheiro}
          >
            Sem banheiro
          </button>
          <button
            type="button"
            className={`${styles.chip} ${incluirInativas ? styles.chipAtivo : ''}`}
            aria-pressed={incluirInativas}
            onClick={alternarInativas}
          >
            Incluir inativas
          </button>
        </div>

        {erro && <Aviso tom="erro">{erro}</Aviso>}

        <div className={styles.cartaoTabela}>
          <div className={`${styles.tabelaRolagem} ${carregando && resposta ? styles.carregando : ''}`} aria-busy={carregando}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Responsável</th>
                  <th>Comunidade</th>
                  <th>Município</th>
                  <th className={styles.numero}>Pessoas</th>
                  <th className={styles.numero}>Até 12</th>
                  <th className={styles.numero}>13 a 59</th>
                  <th className={styles.numero}>60+</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((familia) => (
                  <tr key={familia.id} className={styles.linha} onClick={() => setSelecionada(familia)}>
                    <td>
                      <button
                        type="button"
                        className={styles.nomeBotao}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelecionada(familia);
                        }}
                      >
                        {familia.responsavelNome}
                      </button>
                    </td>
                    <td>{familia.comunidadeNome}</td>
                    <td>{familia.municipioNome}</td>
                    <td className={styles.numero}>{familia.totalPessoas}</td>
                    <td className={styles.numero}>{familia.totalAte12Anos}</td>
                    <td className={styles.numero}>{familia.totalDe13A59Anos}</td>
                    <td className={styles.numero}>{familia.total60AnosOuMais}</td>
                    <td>
                      <div className={styles.badges}>
                        {!familia.ativa && <span className={`${styles.tag} ${styles.tagInativa}`}>Inativa</span>}
                        {familia.semBanheiro && <span className={`${styles.tag} ${styles.tagSemBanheiro}`}>Sem banheiro</span>}
                        {familia.ativa && !familia.semBanheiro && '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!resposta && carregando && <p className={styles.estado}>Carregando…</p>}
          {resposta && itens.length === 0 && (
            <p className={styles.estado}>Nenhuma família encontrada com esses filtros.</p>
          )}
        </div>

        {resposta && total > 0 && (
          <div className={styles.rodape}>
            <span className={styles.contador}>
              Mostrando {formatarNumero(itens.length)} de {formatarNumero(total)}{' '}
              {total === 1 ? 'família' : 'famílias'}
            </span>

            {totalPaginas > 1 && (
              <nav className={styles.paginas} aria-label="Paginação da lista de famílias">
                {paginasVisiveis(resposta.pagina, totalPaginas).map((n, i) =>
                  n === 'reticencias' ? (
                    <span key={`reticencias-${i}`} className={styles.reticencias} aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.botaoPagina} ${n === resposta.pagina ? styles.botaoPaginaAtivo : ''}`}
                      aria-current={n === resposta.pagina ? 'page' : undefined}
                      aria-label={`Página ${n + 1}`}
                      onClick={() => setPagina(n)}
                    >
                      {n + 1}
                    </button>
                  ),
                )}
              </nav>
            )}
          </div>
        )}
      </section>

      <Modal
        aberto={selecionada !== null}
        titulo={selecionada ? `Família de ${selecionada.responsavelNome}` : 'Família'}
        onFechar={fecharModal}
      >
        {selecionada && <DetalhesFamilia key={selecionada.id} item={selecionada} />}
      </Modal>
    </main>
  );
}
