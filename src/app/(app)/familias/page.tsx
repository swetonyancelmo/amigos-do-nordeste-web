'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Modal } from '@/componentes/Modal';
import { api } from '@/lib/api';
import { data } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type { Comunidade, FamiliaDetalhe, FamiliaResumo, Opcao, Pagina, Pessoa } from '@/tipos/dominio';
import styles from './familias.module.css';

const POR_PAGINA = 25;

// Fora do componente: JSX estável, o cabeçalho não re-renderiza à toa.
const ACOES = (
  <Link href="/familias/nova" className="botao botao--primario">
    Nova família
  </Link>
);

/* ------------------------------------------------------------- utilitários */

const formatarNumero = (n: number) => n.toLocaleString('pt-BR');

function rotuloDe(lista: Opcao[] | undefined, valor: string | null | undefined) {
  if (!valor) return '';
  return lista?.find((o) => o.valor === valor)?.rotulo ?? valor;
}

/** A idade vem calculada da API; aqui só se diz de onde ela saiu. */
function exibirIdade(pessoa: Pessoa) {
  if (pessoa.idade === null) return '';
  if (pessoa.dataNascimento) return `${pessoa.idade} anos (nasceu em ${data(pessoa.dataNascimento)})`;
  return `uns ${pessoa.idade} anos (estimada)`;
}

const simNao = (v: boolean | null) => (v === null ? 'Não informado' : v ? 'Sim' : 'Não');

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
function DetalhesFamilia({ id }: { id: string }) {
  const { metadados } = useMetadados();
  const [ficha, setFicha] = useState<FamiliaDetalhe | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    api
      .get<FamiliaDetalhe>(`/familias/${id}`)
      .then((dado) => ativo && setFicha(dado))
      .catch((e) => ativo && setErro(mensagemDeErro(e, 'Não foi possível carregar a família.')));
    return () => {
      ativo = false;
    };
  }, [id]);

  if (erro) return <Aviso tom="erro">{erro}</Aviso>;
  if (!ficha) return <p className={styles.estado} role="status">Carregando…</p>;

  const { totais, pessoas, fontesRenda } = ficha;

  return (
    <>
      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Família</h3>
        <dl className={styles.grade}>
          <Dado rotulo="Responsável">{ficha.responsavelNome}</Dado>
          <Dado rotulo="CPF">{ficha.responsavelCpf}</Dado>
          <Dado rotulo="Telefone">{ficha.telefone}</Dado>
          <Dado rotulo="Situação">{ficha.ativa ? 'Ativa' : 'Inativa'}</Dado>
          <Dado rotulo="Comunidade">{ficha.comunidade.nome}</Dado>
          <Dado rotulo="Município">{ficha.comunidade.municipioNome}</Dado>
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
            {ficha.abastecimentoAgua.map((v) => rotuloDe(metadados?.abastecimentoAgua, v)).join(', ')}
          </Dado>
          <Dado rotulo="Tratamento da água">{rotuloDe(metadados?.tratamentoAgua, ficha.tratamentoAgua)}</Dado>
          <Dado rotulo="Tem banheiro">{simNao(ficha.temBanheiro)}</Dado>
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
            ['Até 12 anos', totais.totalAte12Anos],
            ['13 a 59 anos', totais.totalDe13A59Anos],
            ['60 anos ou mais', totais.total60AnosOuMais],
            ['Sem idade', totais.totalSemIdadeConhecida],
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
                  <span className={styles.cartaoNome}>{pessoa.nome ?? 'Sem nome'}</span>
                  <div className={styles.badges}>
                    {pessoa.cadastroIncompleto && <span className={`${styles.tag} ${styles.tagIncompleto}`}>Incompleto</span>}
                    {pessoa.estuda && <span className={`${styles.tag} ${styles.tagEstuda}`}>Estuda</span>}
                    {pessoa.gestante && <span className={`${styles.tag} ${styles.tagGestante}`}>Gestante</span>}
                  </div>
                </div>
                <dl className={styles.grade}>
                  <Dado rotulo="Parentesco">{rotuloDe(metadados?.parentesco, pessoa.parentesco)}</Dado>
                  <Dado rotulo="Sexo">{rotuloDe(metadados?.sexo, pessoa.sexo)}</Dado>
                  <Dado rotulo="Idade">{exibirIdade(pessoa)}</Dado>
                  <Dado rotulo="Série">
                    {pessoa.estuda === false ? 'Não estuda' : rotuloDe(metadados?.serie, pessoa.serie)}
                  </Dado>
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
        <h3 className={styles.secaoTitulo}>Renda</h3>
        <dl className={styles.grade}>
          <Dado rotulo="Quanto entra por mês, somando tudo" larga>
            {rotuloDe(metadados?.faixaRenda, ficha.faixaRenda)}
          </Dado>
        </dl>
        {fontesRenda.length === 0 ? (
          <p className={styles.vazio}>Nenhuma fonte de renda cadastrada.</p>
        ) : (
          <div className={styles.lista}>
            {fontesRenda.map((renda) => (
              <article key={renda.id} className={styles.cartao}>
                <dl className={styles.grade}>
                  <Dado rotulo="De onde vem">{rotuloDe(metadados?.tipoFonteRenda, renda.tipo)}</Dado>
                  <Dado rotulo="Quem recebe">
                    {renda.pessoaId === null
                      ? 'A família'
                      : (pessoas.find((p) => p.id === renda.pessoaId)?.nome ?? 'Sem nome')}
                  </Dado>
                  {renda.observacao && (
                    <Dado rotulo="Observação" larga>
                      {renda.observacao}
                    </Dado>
                  )}
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

  const [resposta, setResposta] = useState<Pagina<FamiliaResumo> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [selecionada, setSelecionada] = useState<FamiliaResumo | null>(null);
  const ultimaRequisicao = useRef(0);

  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const espera = setTimeout(() => {
      setBusca(digitado.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(espera);
  }, [digitado]);

  // Comunidades para o filtro
  useEffect(() => {
    api.get<Comunidade[]>('/comunidades').then(setComunidades).catch(() => setComunidades([]));
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
      .get<Pagina<FamiliaResumo>>(`/familias?${params}`)
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
          {/* Select, não chip: são dezenas de comunidades. */}
          <select
            className={styles.filtroComunidade}
            value={comunidadeId}
            onChange={(e) => escolherComunidade(e.target.value)}
            aria-label="Comunidade"
          >
            <option value="">Todas as comunidades</option>
            {comunidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} · {c.municipioNome}
              </option>
            ))}
          </select>
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
        {selecionada && <DetalhesFamilia key={selecionada.id} id={selecionada.id} />}
      </Modal>
    </main>
  );
}
