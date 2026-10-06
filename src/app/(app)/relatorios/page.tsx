'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Botao } from '@/componentes/Botao';
import { Aviso } from '@/componentes/Aviso';
import { gerarPdfNecessidades } from '@/componentes/relatorios/gerarPdfNecessidades';
import type { DadosPdfNecessidades } from '@/componentes/relatorios/PdfNecessidades';
import { api } from '@/lib/api';
import { useMetadados } from '@/lib/metadados';
import { hoje, dataHora } from '@/lib/datas';
import type { Comunidade, Indicador, ItemContagem, Municipio, Necessidades, Opcao, Situacao } from '@/tipos/dominio';
import estilos from './relatorios.module.css';

/**
 * Telas 04 e 05 do Figma — necessidades da comunidade: a "lista de compras"
 * de roupa e calçado por tamanho e o recorte da situação das famílias que a
 * associação leva para prefeitura, edital e doador. As contagens vêm da API;
 * aqui só se tiram proporções delas para a leitura (média, porcentagem).
 */

const mensagemDeErro = (e: unknown, padrao: string) => (e instanceof Error ? e.message : padrao);
const numero = (valor: number) => valor.toLocaleString('pt-BR');
const umaCasa = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Parte de um todo, de 0 a 100; 0 quando o todo é zero. */
const fracao = (parte: number, todo: number) => (todo > 0 ? (parte / todo) * 100 : 0);
const porcento = (valor: number) => `${Math.round(valor)}%`;
const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`;

type Barras = { rotulo: string; quantidade: number }[];

/** A API manda a chave do enum; o rótulo vem de /api/metadados. */
function comRotulo(itens: ItemContagem[], opcoes: Opcao[] | undefined): Barras {
  return itens.map(({ chave, quantidade }) => ({
    rotulo: opcoes?.find((opcao) => opcao.valor === chave)?.rotulo ?? chave,
    quantidade,
  }));
}

const somar = (itens: Barras) => itens.reduce((total, item) => total + item.quantidade, 0);

/* ------------------------------------------------------------------ peças */

function Resumo({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: string }) {
  return (
    <div className={`cartao ${estilos.resumo}`}>
      <dt className={estilos.resumoRotulo}>{rotulo}</dt>
      <dd className={estilos.resumoValor}>{valor}</dd>
      {apoio && <dd className={estilos.resumoApoio}>{apoio}</dd>}
    </div>
  );
}

function ListaBarras({ itens, cor, vazio }: { itens: Barras; cor: string; vazio: string }) {
  if (itens.length === 0) return <p className="texto-apoio">{vazio}</p>;
  const maior = Math.max(1, ...itens.map((item) => item.quantidade));
  const total = somar(itens);

  return (
    <ul className={estilos.lista}>
      {itens.map((item) => (
        <li key={item.rotulo} className={estilos.linha}>
          <span className={estilos.rotulo}>{item.rotulo}</span>
          <span className={estilos.trilho} aria-hidden="true">
            <span className={`${estilos.barra} ${cor}`} style={{ width: `${(item.quantidade / maior) * 100}%` }} />
          </span>
          <span className={estilos.quantidade}>{numero(item.quantidade)}</span>
          <span className={estilos.parte}>{porcento(fracao(item.quantidade, total))}</span>
        </li>
      ))}
    </ul>
  );
}

function GrupoCompra({
  id, titulo, apoio, itens, unidade, cor, vazio, semDado, oQue,
}: {
  id: string; titulo: string; apoio: string; itens: Barras | null; unidade: [string, string];
  cor: string; vazio: string; semDado: number; oQue: string;
}) {
  return (
    <section className={`cartao ${estilos.grupo}`} aria-labelledby={id} aria-busy={!itens}>
      <div className={estilos.grupoCabecalho}>
        <div>
          <h2 className={estilos.grupoTitulo} id={id}>{titulo}</h2>
          <p className={estilos.grupoApoio}>{apoio}</p>
        </div>
        {itens && <span className={estilos.selo}>{plural(somar(itens), ...unidade)}</span>}
      </div>
      {itens ? (
        <>
          <ListaBarras itens={itens} cor={cor} vazio={vazio} />
          {semDado > 0 && (
            <p className={`texto-apoio ${estilos.semInformacao}`}>
              + {plural(semDado, 'pessoa', 'pessoas')} sem {oQue}, fora da conta
            </p>
          )}
        </>
      ) : (
        <p className="texto-apoio">Carregando…</p>
      )}
    </section>
  );
}

/** Uma linha de "quanto do cadastro tem este dado". */
function Completude({ rotulo, tem, de }: { rotulo: string; tem: number; de: number }) {
  const parte = fracao(tem, de);
  const tom = parte >= 90 ? estilos.barraVerde : parte >= 60 ? estilos.barraAmbar : estilos.barraLaranja;
  return (
    <li className={estilos.completude}>
      <div className={estilos.completudeTexto}>
        <span>{rotulo}</span>
        <span className={estilos.completudeNumero}>
          {numero(tem)} de {numero(de)} · <strong>{porcento(parte)}</strong>
        </span>
      </div>
      <span className={estilos.trilho} aria-hidden="true">
        <span className={`${estilos.barra} ${tom}`} style={{ width: `${parte}%` }} />
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------- tela */

type ChaveSituacao = keyof Omit<Situacao, 'totalFamilias'>;

const DESTAQUES: { chave: ChaveSituacao; texto: string; tom: string; tomPdf: 'laranja' | 'ambar' | 'verde' }[] = [
  { chave: 'semBanheiro', texto: 'famílias sem banheiro', tom: estilos.tomLaranja, tomPdf: 'laranja' },
  { chave: 'soCarroPipa', texto: 'dependem só de carro-pipa', tom: estilos.tomAmbar, tomPdf: 'ambar' },
  { chave: 'soBolsaFamilia', texto: 'só o Bolsa Família como renda', tom: estilos.tomLaranja, tomPdf: 'laranja' },
  { chave: 'semTratamentoAgua', texto: 'sem tratamento de água', tom: estilos.tomVerde, tomPdf: 'verde' },
];

export default function Relatorios() {
  const { metadados } = useMetadados();

  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioId, setMunicipioId] = useState('');
  const [comunidadeId, setComunidadeId] = useState('');
  const [todasIdades, setTodasIdades] = useState(false);

  const [necessidades, setNecessidades] = useState<Necessidades | null>(null);
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<'excel' | 'pdf' | null>(null);
  const [erroExportacao, setErroExportacao] = useState('');

  useEffect(() => {
    let ativa = true;
    api.get<Comunidade[]>('/comunidades')
      .then((dados) => { if (ativa) setComunidades(dados); })
      .catch(() => { if (ativa) setComunidades([]); });
    api.get<Municipio[]>('/municipios')
      .then((dados) => { if (ativa) setMunicipios(dados); })
      .catch(() => { if (ativa) setMunicipios([]); });
    return () => { ativa = false; };
  }, []);

  // A mesma query string serve às duas rotas e à planilha.
  const filtro = useMemo(() => {
    const parametros = new URLSearchParams();
    if (municipioId) parametros.set('municipioId', municipioId);
    if (comunidadeId) parametros.set('comunidadeId', comunidadeId);
    return parametros;
  }, [municipioId, comunidadeId]);

  useEffect(() => {
    let ativa = true;
    const comIdades = new URLSearchParams(filtro);
    if (todasIdades) comIdades.set('todasIdades', 'true');

    setNecessidades(null);
    setSituacao(null);
    setErro('');
    Promise.all([
      api.get<Necessidades>(`/relatorios/necessidades?${comIdades}`),
      api.get<Situacao>(`/relatorios/situacao?${filtro}`),
    ])
      .then(([n, s]) => {
        if (!ativa) return;
        setNecessidades(n);
        setSituacao(s);
        setAtualizadoEm(new Date().toISOString());
      })
      .catch((e) => { if (ativa) setErro(mensagemDeErro(e, 'Não foi possível carregar o relatório.')); });
    return () => { ativa = false; };
  }, [filtro, todasIdades]);

  const comunidadesDoMunicipio = municipioId
    ? comunidades.filter((c) => c.municipioId === municipioId)
    : comunidades;
  const comunidade = comunidades.find((c) => c.id === comunidadeId);
  const municipio = municipios.find((m) => m.id === (comunidade?.municipioId ?? municipioId));
  const lugar = municipio ? `${municipio.nome} — ${municipio.uf}` : comunidade?.municipioNome;
  const escopo = comunidade
    ? `${comunidade.nome} · ${lugar}`
    : municipio ? `Todas as comunidades de ${lugar}` : 'Todas as comunidades';
  const publico = todasIdades ? 'Todas as idades' : 'Crianças até 12 anos';
  // O subtítulo também é o que diz, na folha impressa, qual recorte saiu.
  const subtitulo = `${escopo} · ${publico}${atualizadoEm ? ` · atualizado em ${dataHora(atualizadoEm)}` : ''}`;

  const roupa = useMemo(
    () => (necessidades ? comRotulo(necessidades.roupa, metadados?.tamanhoRoupa) : null),
    [necessidades, metadados],
  );
  const calcado = useMemo(
    () => (necessidades ? comRotulo(necessidades.calcado, metadados?.numeroCalcado) : null),
    [necessidades, metadados],
  );
  // Com todasIdades=false a API conta roupa/calçado só de quem tem até 12 anos.
  const contadas = necessidades ? (todasIdades ? necessidades.totalPessoas : necessidades.totalCriancasAte12) : 0;
  const semFamilias = necessidades?.totalFamilias === 0;

  // Só destaca quando há uma maior de fato: com empate, nenhuma ganha o selo.
  const maiorValor = situacao ? Math.max(...DESTAQUES.map((d) => situacao[d.chave].valor)) : 0;
  const maiorNecessidade = situacao && maiorValor > 0
    && DESTAQUES.filter((d) => situacao[d.chave].valor === maiorValor).length === 1
    ? DESTAQUES.find((d) => situacao[d.chave].valor === maiorValor)
    : undefined;

  // Mesmos números da tela, no formato do PDF. null enquanto carrega.
  const dadosPdf = useMemo<Omit<DadosPdfNecessidades, 'logo'> | null>(() => {
    if (!necessidades || !situacao || !roupa || !calcado || !atualizadoEm) return null;
    const emLinhas = (itens: Barras) => {
      const total = somar(itens);
      return itens.map((i) => ({ rotulo: i.rotulo, valor: i.quantidade, parte: fracao(i.quantidade, total) }));
    };
    return {
      geradoEm: dataHora(atualizadoEm),
      comunidade: comunidade?.nome ?? 'Todas',
      municipio: lugar ?? 'Todos',
      publico,
      tituloRoupa: todasIdades ? 'Roupa' : 'Roupa infantil',
      resumo: [
        { rotulo: 'Famílias', valor: numero(necessidades.totalFamilias), apoio: 'ativas no filtro' },
        {
          rotulo: 'Pessoas',
          valor: numero(necessidades.totalPessoas),
          apoio: necessidades.totalFamilias > 0
            ? `média de ${umaCasa(necessidades.totalPessoas / necessidades.totalFamilias)} por família`
            : undefined,
        },
        {
          rotulo: 'Crianças até 12',
          valor: numero(necessidades.totalCriancasAte12),
          apoio: `${porcento(fracao(necessidades.totalCriancasAte12, necessidades.totalPessoas))} das pessoas`,
        },
        {
          rotulo: 'Itens a comprar',
          valor: numero(somar(roupa) + somar(calcado)),
          apoio: `${plural(somar(roupa), 'peça', 'peças')} e ${plural(somar(calcado), 'par', 'pares')}`,
        },
      ],
      roupa: emLinhas(roupa),
      calcado: emLinhas(calcado),
      semTamanho: necessidades.semTamanhoInformado,
      semCalcado: necessidades.semCalcadoInformado,
      totalFamilias: situacao.totalFamilias,
      situacao: DESTAQUES.map((d) => ({
        rotulo: d.texto.charAt(0).toUpperCase() + d.texto.slice(1),
        valor: situacao[d.chave].valor,
        parte: situacao[d.chave].percentual,
        tom: d.tomPdf,
      })),
      completude: [
        { rotulo: 'Tamanho de roupa informado', tem: contadas - necessidades.semTamanhoInformado, de: contadas },
        { rotulo: 'Numeração de calçado informada', tem: contadas - necessidades.semCalcadoInformado, de: contadas },
        {
          rotulo: 'Idade informada (nascimento ou estimada)',
          tem: necessidades.totalPessoas - necessidades.semIdadeInformada,
          de: necessidades.totalPessoas,
        },
      ].map((l) => ({ ...l, parte: fracao(l.tem, l.de) })),
    };
  }, [necessidades, situacao, roupa, calcado, atualizadoEm, comunidade, lugar, publico, todasIdades, contadas]);

  const acoes = useMemo(() => {
    const nomeBase = `necessidades-${hoje()}`;

    async function exportarExcel() {
      const parametros = new URLSearchParams(filtro);
      if (todasIdades) parametros.set('todasIdades', 'true');
      setBaixando('excel');
      setErroExportacao('');
      try {
        await api.baixar(`/relatorios/necessidades.xlsx?${parametros}`, `${nomeBase}.xlsx`);
      } catch (e) {
        setErroExportacao(mensagemDeErro(e, 'Não foi possível gerar a planilha.'));
      } finally {
        setBaixando(null);
      }
    }

    async function exportarPdf() {
      if (!dadosPdf) return;
      setBaixando('pdf');
      setErroExportacao('');
      try {
        await gerarPdfNecessidades(dadosPdf, `${nomeBase}.pdf`);
      } catch {
        setErroExportacao('Não foi possível gerar o PDF. Tente de novo.');
      } finally {
        setBaixando(null);
      }
    }

    return (
      <>
        <Botao variante="secundario" onClick={exportarPdf} disabled={!dadosPdf || baixando !== null}>
          {baixando === 'pdf' ? 'Gerando PDF…' : 'Exportar PDF'}
        </Botao>
        <Botao variante="sucesso" onClick={exportarExcel} disabled={baixando !== null}>
          {baixando === 'excel' ? 'Gerando planilha…' : 'Exportar Excel'}
        </Botao>
      </>
    );
  }, [filtro, todasIdades, baixando, dadosPdf]);

  useCabecalho('Necessidades da comunidade', acoes, { subtitulo });

  return (
    <div className={estilos.pagina}>
      <div className={`${estilos.filtros} nao-imprime`}>
        <label className={estilos.filtro}>
          <span className={estilos.filtroRotulo}>Município</span>
          <select
            className={estilos.filtroSelect}
            value={municipioId}
            onChange={(e) => { setMunicipioId(e.target.value); setComunidadeId(''); }}
          >
            <option value="">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nome} — {m.uf}</option>
            ))}
          </select>
        </label>
        <label className={estilos.filtro}>
          <span className={estilos.filtroRotulo}>Comunidade</span>
          <select
            className={estilos.filtroSelect}
            value={comunidadeId}
            onChange={(e) => setComunidadeId(e.target.value)}
          >
            <option value="">Todas as comunidades</option>
            {comunidadesDoMunicipio.map((c) => (
              <option key={c.id} value={c.id}>
                {municipioId ? c.nome : `${c.nome} — ${c.municipioNome}`}
              </option>
            ))}
          </select>
        </label>
        <label className={estilos.filtro}>
          <span className={estilos.filtroRotulo}>Faixa etária</span>
          <select
            className={estilos.filtroSelect}
            value={todasIdades ? 'todas' : 'ate12'}
            onChange={(e) => setTodasIdades(e.target.value === 'todas')}
          >
            <option value="ate12">Crianças até 12 anos</option>
            <option value="todas">Todas as idades</option>
          </select>
        </label>
      </div>

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {erroExportacao && <Aviso tom="erro" titulo="Exportação">{erroExportacao}</Aviso>}

      <dl className={estilos.resumos} aria-busy={!necessidades}>
        <Resumo rotulo="Famílias" valor={necessidades ? numero(necessidades.totalFamilias) : '…'} apoio="ativas no filtro" />
        <Resumo
          rotulo="Pessoas"
          valor={necessidades ? numero(necessidades.totalPessoas) : '…'}
          apoio={necessidades && necessidades.totalFamilias > 0
            ? `média de ${umaCasa(necessidades.totalPessoas / necessidades.totalFamilias)} por família`
            : undefined}
        />
        <Resumo
          rotulo="Crianças até 12"
          valor={necessidades ? numero(necessidades.totalCriancasAte12) : '…'}
          apoio={necessidades && necessidades.totalPessoas > 0
            ? `${porcento(fracao(necessidades.totalCriancasAte12, necessidades.totalPessoas))} das pessoas`
            : undefined}
        />
        <Resumo
          rotulo="Itens a comprar"
          valor={roupa && calcado ? numero(somar(roupa) + somar(calcado)) : '…'}
          apoio={roupa && calcado
            ? `${plural(somar(roupa), 'peça', 'peças')} e ${plural(somar(calcado), 'par', 'pares')}`
            : undefined}
        />
      </dl>

      {semFamilias && (
        <Aviso titulo="Nada neste filtro">
          Nenhuma família ativa cadastrada aqui ainda. Escolha outra comunidade ou município.
        </Aviso>
      )}

      {!semFamilias && (
        <>
          <div className={estilos.grupos}>
            <GrupoCompra
              id="titulo-roupa"
              titulo={todasIdades ? 'Roupa' : 'Roupa infantil'}
              apoio="Quantas peças comprar, por tamanho"
              itens={roupa}
              unidade={['peça', 'peças']}
              cor={estilos.barraLaranja}
              vazio="Ninguém com tamanho informado neste filtro."
              semDado={necessidades?.semTamanhoInformado ?? 0}
              oQue="tamanho informado"
            />
            <GrupoCompra
              id="titulo-calcado"
              titulo="Calçado"
              apoio="Pares por numeração"
              itens={calcado}
              unidade={['par', 'pares']}
              cor={estilos.barraAmbar}
              vazio="Ninguém com numeração informada neste filtro."
              semDado={necessidades?.semCalcadoInformado ?? 0}
              oQue="numeração informada"
            />
          </div>

          <section className={`cartao ${estilos.grupo}`} aria-labelledby="titulo-situacao" aria-busy={!situacao}>
            <div className={estilos.grupoCabecalho}>
              <div>
                <h2 className={estilos.grupoTitulo} id="titulo-situacao">Situação das famílias</h2>
                <p className={estilos.grupoApoio}>
                  É este recorte que a associação leva para prefeitura, edital e doador — não o cadastro
                </p>
              </div>
            </div>
            {situacao ? (
              <ul className={estilos.situacao}>
                {DESTAQUES.map(({ chave, texto, tom }) => {
                  const indicador: Indicador = situacao[chave];
                  const maior = maiorNecessidade?.chave === chave;
                  return (
                    <li key={chave} className={`${estilos.destaque} ${tom}`}>
                      {maior && <span className={estilos.destaqueSelo}>Maior necessidade</span>}
                      <span className={estilos.destaqueValor}>{numero(indicador.valor)}</span>
                      <span className={estilos.destaqueTexto}>{texto}</span>
                      <span className={estilos.medidor} aria-hidden="true">
                        <span style={{ width: `${indicador.percentual}%` }} />
                      </span>
                      <span className={estilos.destaquePct}>
                        {porcento(indicador.percentual)} de {plural(situacao.totalFamilias, 'família', 'famílias')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="texto-apoio">Carregando…</p>
            )}
          </section>

          {necessidades && (
            <section className={`cartao ${estilos.grupo}`} aria-labelledby="titulo-qualidade">
              <div className={estilos.grupoCabecalho}>
                <div>
                  <h2 className={estilos.grupoTitulo} id="titulo-qualidade">Qualidade do cadastro</h2>
                  <p className={estilos.grupoApoio}>
                    Quem está sem o dado fica fora da lista de compras. Quanto mais perto de 100%, mais certa a compra.
                  </p>
                </div>
                <Link href="/pessoas" className={`${estilos.acaoGrupo} nao-imprime`}>
                  Completar em Pessoas
                </Link>
              </div>
              <ul className={estilos.completudes}>
                <Completude
                  rotulo="Tamanho de roupa informado"
                  tem={contadas - necessidades.semTamanhoInformado}
                  de={contadas}
                />
                <Completude
                  rotulo="Numeração de calçado informada"
                  tem={contadas - necessidades.semCalcadoInformado}
                  de={contadas}
                />
                <Completude
                  rotulo="Idade informada (nascimento ou estimada)"
                  tem={necessidades.totalPessoas - necessidades.semIdadeInformada}
                  de={necessidades.totalPessoas}
                />
              </ul>
              {!todasIdades && necessidades.semIdadeInformada > 0 && (
                <p className={`texto-apoio ${estilos.semInformacao}`}>
                  Quem está sem idade não entra na conta de até 12 anos, nem na lista de compras infantil.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
