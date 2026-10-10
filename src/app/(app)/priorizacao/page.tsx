'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Carregando, FalhaAoCarregar, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { ComoECalculada } from '@/componentes/vulnerabilidade/ComoECalculada';
import { DistribuicaoEstratos } from '@/componentes/vulnerabilidade/DistribuicaoEstratos';
import { SeloEstrato } from '@/componentes/vulnerabilidade/SeloEstrato';
import { api } from '@/lib/api';
import { dataHora } from '@/lib/datas';
import {
  DADOS_INSUFICIENTES,
  FRASE_SUGESTAO,
  REFERENCIA_INSTRUMENTO,
  SEM_RISCO_IDENTIFICADO,
  nomeDoCampo,
} from '@/lib/vulnerabilidade';
import type {
  ContagemEstrato,
  FamiliaResumo,
  Municipio,
  Pagina,
  RelatorioVulnerabilidade,
  VulnerabilidadePorComunidade,
} from '@/tipos/dominio';
import estilos from './priorizacao.module.css';

/*
 * Priorização (ADR-0010 da API): a folha que a responsável leva impressa para
 * planejar a semana.
 *
 * De onde vem cada coisa:
 *  - totais por estrato, município e comunidade: GET /api/relatorios/vulnerabilidade
 *    (só contagens; essa rota não traz família nenhuma, de propósito);
 *  - as famílias: GET /api/familias?comunidadeId=…&ordenacao=PRIORIDADE&estrato=…,
 *    uma consulta por comunidade. A ORDEM é a do servidor; aqui só se separa
 *    o que tem posição na escala dos cadastros a completar. Nenhum escore é
 *    calculado nem reordenado no front.
 *
 * Cadastros a completar (DADOS_INSUFICIENTES) não têm posição na escala:
 * ficam num bloco próprio no fim, nunca no meio da ordenação.
 */

/** Teto de itens por página da API. */
const POR_PAGINA = 100;
/** Quantas comunidades buscar ao mesmo tempo: a API é gratuita e pequena. */
const SIMULTANEAS = 3;

type FamiliasDaComunidade = {
  comunidade: VulnerabilidadePorComunidade;
  comPosicao: FamiliaResumo[];
  aCompletar: FamiliaResumo[];
};

const quantas = (n: number, uma: string, varias: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? uma : varias}`;

function contagem(distribuicao: ContagemEstrato[], estratos: Set<string>) {
  return distribuicao.filter((c) => estratos.has(c.estrato)).reduce((soma, c) => soma + c.valor, 0);
}

/** Todas as páginas de uma comunidade, na ordem que a API devolve. */
async function buscarFamiliasDaComunidade(comunidadeId: string, estratos: string[]): Promise<FamiliaResumo[]> {
  const todas: FamiliaResumo[] = [];
  for (let pagina = 0; ; pagina++) {
    const params = new URLSearchParams({
      comunidadeId,
      ordenacao: 'PRIORIDADE',
      porPagina: String(POR_PAGINA),
      pagina: String(pagina),
    });
    for (const e of estratos) params.append('estrato', e);
    const resposta = await api.get<Pagina<FamiliaResumo>>(`/familias?${params}`);
    todas.push(...resposta.itens);
    if (pagina + 1 >= resposta.totalPaginas) return todas;
  }
}

export default function Priorizacao() {
  return (
    <Suspense fallback={<Carregando mensagem="Carregando a priorização" linhas={8} />}>
      <ConteudoPriorizacao />
    </Suspense>
  );
}

function ConteudoPriorizacao() {
  const acoes = useMemo(() => <Botao variante="secundario" onClick={() => window.print()}>Imprimir</Botao>, []);
  useCabecalho('Priorização', acoes);

  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const municipioId = parametros.get('municipioId') ?? '';
  const incluirSemPrioridade = parametros.get('incluirSemPrioridade') === 'true';

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioVulnerabilidade | null>(null);
  const [familias, setFamilias] = useState<FamiliasDaComunidade[] | null>(null);
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 });
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [emitidoEm, setEmitidoEm] = useState('');

  useEffect(() => {
    api.get<Municipio[]>('/municipios').then(setMunicipios).catch(() => setMunicipios([]));
  }, []);

  useEffect(() => {
    let ativo = true;
    setRelatorio(null);
    setFamilias(null);
    setErro('');
    setProgresso({ feitas: 0, total: 0 });

    (async () => {
      const consulta = municipioId ? `?municipioId=${encodeURIComponent(municipioId)}` : '';
      const rel = await api.get<RelatorioVulnerabilidade>(`/relatorios/vulnerabilidade${consulta}`);
      if (!ativo) return;
      setRelatorio(rel);

      // Estratos com posição na escala: todos os que a API conhece, menos
      // "a completar" e, salvo pedido, "sem prioridade". Lido da resposta,
      // não fixado aqui: um estrato novo na API aparece sozinho.
      const comPosicao = rel.distribuicao
        .map((c) => c.estrato)
        .filter((e) => e !== DADOS_INSUFICIENTES && (incluirSemPrioridade || e !== SEM_RISCO_IDENTIFICADO));
      const pedidos = new Set([...comPosicao, DADOS_INSUFICIENTES]);
      const comunidades = rel.porComunidade.filter((c) => contagem(c.distribuicao, pedidos) > 0);
      setProgresso({ feitas: 0, total: comunidades.length });

      const resultado: FamiliasDaComunidade[] = new Array(comunidades.length);
      let proxima = 0;
      let feitas = 0;
      async function trabalhar() {
        while (ativo && proxima < comunidades.length) {
          const indice = proxima++;
          const comunidade = comunidades[indice];
          const lista = await buscarFamiliasDaComunidade(comunidade.comunidadeId, [...pedidos]);
          resultado[indice] = {
            comunidade,
            comPosicao: lista.filter((f) => f.vulnerabilidade?.estrato !== DADOS_INSUFICIENTES),
            aCompletar: lista.filter((f) => f.vulnerabilidade?.estrato === DADOS_INSUFICIENTES),
          };
          feitas++;
          if (ativo) setProgresso({ feitas, total: comunidades.length });
        }
      }
      await Promise.all(Array.from({ length: SIMULTANEAS }, trabalhar));
      if (!ativo) return;
      setFamilias(resultado);
      setEmitidoEm(dataHora(new Date().toISOString()));
    })().catch((e) => {
      if (ativo) setErro(mensagemDeFalha(e, 'Não foi possível carregar a priorização. Tente de novo.'));
    });

    return () => {
      ativo = false;
    };
  }, [municipioId, incluirSemPrioridade, tentativa]);

  function trocarNaUrl(nome: string, valor: string) {
    const novos = new URLSearchParams(parametros.toString());
    if (valor) novos.set(nome, valor);
    else novos.delete(nome);
    const consulta = novos.toString();
    router.replace(`${pathname}${consulta ? `?${consulta}` : ''}`, { scroll: false });
  }

  const nomeMunicipio = municipios.find((m) => m.id === municipioId)?.nome;
  const comFamiliasComPosicao = familias?.filter((f) => f.comPosicao.length > 0) ?? [];
  const comFamiliasACompletar = familias?.filter((f) => f.aCompletar.length > 0) ?? [];
  const totalACompletar = relatorio?.distribuicao.find((c) => c.estrato === DADOS_INSUFICIENTES)?.valor ?? 0;
  const totalSemPrioridade = relatorio?.distribuicao.find((c) => c.estrato === SEM_RISCO_IDENTIFICADO);

  return (
    <div className={estilos.pagina}>
      <div className={`${estilos.filtros} nao-imprime`}>
        <label className={estilos.filtro}>
          <span className={estilos.filtroRotulo}>Município</span>
          <select
            className={estilos.filtroSelect}
            value={municipioId}
            onChange={(e) => trocarNaUrl('municipioId', e.target.value)}
          >
            <option value="">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </label>
        <label className={estilos.marcar}>
          <input
            type="checkbox"
            checked={incluirSemPrioridade}
            onChange={(e) => trocarNaUrl('incluirSemPrioridade', e.target.checked ? 'true' : '')}
          />
          Listar também as famílias sem prioridade indicada pela escala
        </label>
      </div>

      <header className={estilos.folhaCabecalho}>
        <p className={estilos.recorte}>
          {nomeMunicipio ? `Município: ${nomeMunicipio}` : 'Todos os municípios'}
          {emitidoEm && ` · emitida em ${emitidoEm}`}
        </p>
        <p className={estilos.frase}>{FRASE_SUGESTAO}</p>
        <p className={estilos.instrumento}>
          <strong>Instrumento:</strong> {REFERENCIA_INSTRUMENTO}
          {relatorio && relatorio.sentinelasNaoAvaliadas.length > 0 && (
            <>
              {' '}A avaliação não considera:{' '}
              {relatorio.sentinelasNaoAvaliadas.map((s) => s.nome.toLowerCase()).join(', ')}.
              Uma família pode precisar de apoio por motivos que a escala não vê.
            </>
          )}
        </p>
      </header>

      <ComoECalculada className={estilos.comoCalcula} />

      {erro ? (
        <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />
      ) : !relatorio || !familias ? (
        <Carregando
          mensagem={relatorio ? 'Carregando as famílias por comunidade' : 'Carregando a priorização'}
          progresso={progresso.total > 0 ? `(${progresso.feitas} de ${progresso.total} comunidades)` : undefined}
          linhas={8}
        />
      ) : relatorio.totalFamilias === 0 ? (
        <p className={estilos.vazio}>Nenhuma família ativa neste recorte.</p>
      ) : (
        <>
          <section className={estilos.bloco} aria-labelledby="titulo-totais">
            <h2 id="titulo-totais" className={estilos.blocoTitulo}>
              Totais · {quantas(relatorio.totalFamilias, 'família ativa', 'famílias ativas')}
            </h2>
            <DistribuicaoEstratos distribuicao={relatorio.distribuicao} />

            <TabelaTotais
              titulo="Por município"
              coluna="Município"
              distribuicaoGeral={relatorio.distribuicao}
              linhas={relatorio.porMunicipio.map((m) => ({
                chave: m.municipioId, nome: m.municipioNome, total: m.totalFamilias, distribuicao: m.distribuicao,
              }))}
            />
            <TabelaTotais
              titulo="Por comunidade"
              coluna="Comunidade"
              distribuicaoGeral={relatorio.distribuicao}
              linhas={relatorio.porComunidade.map((c) => ({
                chave: c.comunidadeId,
                nome: `${c.comunidadeNome} (${c.municipioNome})`,
                total: c.totalFamilias,
                distribuicao: c.distribuicao,
              }))}
            />
          </section>

          <section className={estilos.bloco} aria-labelledby="titulo-ordem">
            <h2 id="titulo-ordem" className={estilos.blocoTitulo}>Famílias por prioridade sugerida, por comunidade</h2>
            {!incluirSemPrioridade && totalSemPrioridade && totalSemPrioridade.valor > 0 && (
              <p className={estilos.nota}>
                {quantas(totalSemPrioridade.valor, 'família', 'famílias')} em &quot;{totalSemPrioridade.rotulo}&quot;
                não {totalSemPrioridade.valor === 1 ? 'está listada' : 'estão listadas'} aqui.
              </p>
            )}
            {comFamiliasComPosicao.length === 0 ? (
              <p className={estilos.vazio}>Nenhuma família com prioridade indicada pela escala neste recorte.</p>
            ) : (
              comFamiliasComPosicao.map(({ comunidade, comPosicao }) => (
                <div key={comunidade.comunidadeId} className={estilos.comunidade}>
                  <h3 className={estilos.comunidadeTitulo}>
                    {comunidade.comunidadeNome} <span>· {comunidade.municipioNome}</span>
                  </h3>
                  <TabelaFamilias familias={comPosicao} />
                </div>
              ))
            )}
          </section>

          <section className={`${estilos.bloco} ${estilos.blocoACompletar}`} aria-labelledby="titulo-completar">
            <h2 id="titulo-completar" className={estilos.blocoTitulo}>
              Cadastros a completar · {quantas(totalACompletar, 'família', 'famílias')} sem posição na escala
            </h2>
            <p className={estilos.nota}>
              Estas famílias não estão &quot;sem risco&quot;: falta dado no cadastro para avaliá-las. Completar o
              cadastro é o que as coloca na ordem acima.
            </p>
            {relatorio.camposFaltantes.length > 0 && (
              <p className={estilos.nota}>
                O que mais falta:{' '}
                {relatorio.camposFaltantes
                  .slice(0, 4)
                  .map((c) => `${nomeDoCampo(c.campo).toLowerCase()} (${c.familias})`)
                  .join('; ')}
                .
              </p>
            )}
            {comFamiliasACompletar.length === 0 ? (
              <p className={estilos.vazio}>Nenhum cadastro a completar neste recorte.</p>
            ) : (
              comFamiliasACompletar.map(({ comunidade, aCompletar }) => (
                <div key={comunidade.comunidadeId} className={estilos.comunidade}>
                  <h3 className={estilos.comunidadeTitulo}>
                    {comunidade.comunidadeNome} <span>· {comunidade.municipioNome}</span>
                  </h3>
                  <TabelaFamilias familias={aCompletar} aCompletar />
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

type LinhaTotal = { chave: string; nome: string; total: number; distribuicao: ContagemEstrato[] };

function TabelaTotais({ titulo, coluna, distribuicaoGeral, linhas }: {
  titulo: string;
  coluna: string;
  distribuicaoGeral: ContagemEstrato[];
  linhas: LinhaTotal[];
}) {
  if (linhas.length === 0) return null;
  return (
    <div className={estilos.tabelaRolagem}>
      <table className={`${estilos.tabela} ${estilos.tabelaTotais}`}>
        <caption className={estilos.legenda}>{titulo}</caption>
        <colgroup>
          <col className={estilos.colNome} />
          <col className={estilos.colNumero} />
          {distribuicaoGeral.map((c) => <col key={c.estrato} />)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{coluna}</th>
            <th scope="col" className={estilos.numero}>Famílias</th>
            {distribuicaoGeral.map((c) => (
              <th key={c.estrato} scope="col" className={estilos.numero}>{c.rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave}>
              <th scope="row">{l.nome}</th>
              <td className={`${estilos.numero} ${estilos.celulaTotal}`} data-rotulo="Famílias">
                {l.total.toLocaleString('pt-BR')}
              </td>
              {distribuicaoGeral.map((g) => (
                <td key={g.estrato} className={estilos.numero} data-rotulo={g.rotulo}>
                  {(l.distribuicao.find((c) => c.estrato === g.estrato)?.valor ?? 0).toLocaleString('pt-BR')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaFamilias({ familias, aCompletar = false }: { familias: FamiliaResumo[]; aCompletar?: boolean }) {
  return (
    <div className={estilos.tabelaRolagem}>
      <table className={`${estilos.tabela} ${estilos.tabelaFamilias}`}>
        <colgroup>
          <col className={estilos.colPrioridade} />
          <col />
          <col className={estilos.colNumero} />
          <col className={estilos.colNumero} />
          <col className={estilos.colNumero} />
          {aCompletar && <col className={`${estilos.colAcao} nao-imprime`} />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Prioridade sugerida</th>
            <th scope="col">Responsável</th>
            <th scope="col" className={estilos.numero}>Pessoas</th>
            <th scope="col" className={estilos.numero}>Até 12</th>
            <th scope="col" className={estilos.numero}>60+</th>
            {aCompletar && <th scope="col" className="nao-imprime"><span className="so-leitor-de-tela">Ação</span></th>}
          </tr>
        </thead>
        <tbody>
          {familias.map((f) => (
            <tr key={f.id}>
              <td className={estilos.celulaPrioridade}>
                {f.vulnerabilidade ? <SeloEstrato estrato={f.vulnerabilidade.estrato} rotulo={f.vulnerabilidade.rotulo} /> : '—'}
              </td>
              <th scope="row" className={estilos.responsavel}>{f.responsavelNome}</th>
              <td className={estilos.numero} data-rotulo="Pessoas">{f.totalPessoas}</td>
              <td className={estilos.numero} data-rotulo="Até 12">{f.totalAte12Anos}</td>
              <td className={estilos.numero} data-rotulo="60+">{f.total60AnosOuMais}</td>
              {aCompletar && (
                <td className={`${estilos.celulaAcao} nao-imprime`}>
                  <Link href={`/familias/${f.id}/editar`} aria-label={`Completar o cadastro da família de ${f.responsavelNome}`}>
                    Completar
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
