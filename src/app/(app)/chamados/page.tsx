'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Aviso } from '@/componentes/Aviso';
import { Selecao } from '@/componentes/Selecao';
import { api } from '@/lib/api';
import { dataHora } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type { PreCadastroResumo, SituacaoPreCadastro } from '@/tipos/dominio';
import estilos from './chamados.module.css';

const CLASSE_SELO: Record<SituacaoPreCadastro, string> = {
  PENDENTE: estilos.seloPendente,
  APROVADO: estilos.seloAprovado,
  DEVOLVIDO: estilos.seloDevolvido,
};

/**
 * Chamados: a fila dos pré-cadastros que as agentes enviaram pelo app.
 * Pendente é o padrão — é o que espera a associação. Cada linha leva para a
 * revisão, onde se aprova (vira família) ou devolve com o motivo.
 *
 * O aviso de possível duplicata vem da API (mesma comunidade e mesmo
 * telefone ou nome parecido). É só aviso: quem decide é quem revisa.
 */
export default function Chamados() {
  useCabecalho('Chamados');
  const { metadados } = useMetadados();

  const [situacao, setSituacao] = useState<SituacaoPreCadastro | ''>('PENDENTE');
  const [lista, setLista] = useState<PreCadastroResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setLista(null);
    setErro(null);
    const filtro = situacao ? `?situacao=${situacao}` : '';
    api.get<PreCadastroResumo[]>(`/pre-cadastros${filtro}`)
      .then((r) => { if (ativo) setLista(r); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
    return () => { ativo = false; };
  }, [situacao]);

  const rotuloSituacao = (s: SituacaoPreCadastro) =>
    metadados?.situacaoPreCadastro.find((o) => o.valor === s)?.rotulo ?? s;

  return (
    <section className={estilos.pagina}>
      <div className={estilos.filtros}>
        <Selecao
          rotulo="Situação"
          opcoes={metadados?.situacaoPreCadastro}
          vazio="Todas"
          value={situacao}
          onChange={(e) => setSituacao(e.target.value as SituacaoPreCadastro | '')}
        />
      </div>

      {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}

      {!erro && lista === null && <p className="texto-apoio" role="status">Carregando…</p>}

      {lista?.length === 0 && (
        <p className="texto-apoio">
          {situacao === 'PENDENTE' ? 'Nenhum chamado esperando revisão.' : 'Nenhum chamado nesta situação.'}
        </p>
      )}

      {lista && lista.length > 0 && (
        <div className={estilos.tabelaRolagem}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Comunidade</th>
                <th className={estilos.numero}>Pessoas</th>
                <th>Agente</th>
                <th>Recebido em</th>
                <th>Situação</th>
                <th><span className="so-leitor-de-tela">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.responsavelNome ?? '—'}
                    {c.possivelDuplicata && (
                      <>
                        {' '}
                        <span className={`${estilos.selo} ${estilos.seloDuplicata}`}>
                          Possível duplicata
                        </span>
                      </>
                    )}
                  </td>
                  <td>{c.comunidadeNome ?? '—'}{!c.comunidadeId && ' (não reconhecida)'}</td>
                  <td className={estilos.numero}>{c.totalPessoas}</td>
                  <td>{c.agenteNome}</td>
                  <td>{dataHora(c.recebidoEm)}</td>
                  <td>
                    <span className={`${estilos.selo} ${CLASSE_SELO[c.situacao]}`}>
                      {rotuloSituacao(c.situacao)}
                    </span>
                  </td>
                  <td>
                    <Link className={estilos.link} href={`/chamados/${c.id}`}>
                      {c.situacao === 'PENDENTE' ? 'Revisar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
