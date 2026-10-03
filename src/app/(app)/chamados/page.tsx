'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Aviso } from '@/componentes/Aviso';
import { Paginacao, paginarNoCliente } from '@/componentes/Paginacao';
import { api } from '@/lib/api';
import { dataHora } from '@/lib/datas';
import type { PreCadastroResumo, SituacaoPreCadastro } from '@/tipos/dominio';
import estilos from './chamados.module.css';

type Aba = { valor: SituacaoPreCadastro; rotulo: string };

const ABAS: Aba[] = [
  { valor: 'PENDENTE', rotulo: 'Esperando você' },
  { valor: 'APROVADO', rotulo: 'Aprovados' },
  { valor: 'DEVOLVIDO', rotulo: 'Devolvidos' },
];

/**
 * Chamados: a fila dos pré-cadastros que as agentes enviaram pelo app.
 * "Esperando você" é a aba padrão — é o que espera a associação. Cada card
 * leva para a revisão, onde se aprova (vira família) ou devolve com o motivo.
 *
 * Busca tudo de uma vez e separa por situação no cliente: evita três
 * requisições só para mostrar a contagem de cada aba.
 *
 * O aviso de possível duplicata vem da API (mesma comunidade e mesmo
 * telefone ou nome parecido). É só aviso: quem decide é quem revisa.
 */
export default function Chamados() {
  useCabecalho('Chamados');

  const [aba, setAba] = useState<SituacaoPreCadastro>('PENDENTE');
  const [todos, setTodos] = useState<PreCadastroResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(20);

  useEffect(() => {
    let ativo = true;
    api.get<PreCadastroResumo[]>('/pre-cadastros')
      .then((r) => { if (ativo) setTodos(r); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
    return () => { ativo = false; };
  }, []);

  const porSituacao = (s: SituacaoPreCadastro) => (todos ?? []).filter((c) => c.situacao === s);
  const lista = todos ? porSituacao(aba) : null;

  return (
    <section className={estilos.pagina}>
      <p className="texto-apoio">
        Cadastros enviados pelas agentes de saúde. Nada entra na base de famílias sem você aprovar.
      </p>

      <div className={estilos.abas} role="tablist">
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            role="tab"
            aria-selected={aba === a.valor}
            className={aba === a.valor ? `${estilos.aba} ${estilos.abaAtiva}` : estilos.aba}
            onClick={() => { setAba(a.valor); setPagina(0); }}
          >
            {a.rotulo} · {todos ? porSituacao(a.valor).length : '—'}
          </button>
        ))}
      </div>

      {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}

      {!erro && lista === null && <p className="texto-apoio" role="status">Carregando…</p>}

      {lista?.length === 0 && (
        <p className="texto-apoio">
          {aba === 'PENDENTE' ? 'Nenhum chamado esperando revisão.' : 'Nenhum chamado nesta situação.'}
        </p>
      )}

      {lista && lista.length > 0 && (
        <div className={estilos.cards}>
          {paginarNoCliente(lista, pagina, porPagina).map((c) => (
            <div
              key={c.id}
              className={
                c.possivelDuplicata ? `cartao ${estilos.card} ${estilos.cardAlerta}` : `cartao ${estilos.card}`
              }
            >
              <div className={estilos.cardCorpo}>
                <div className={estilos.cardTitulo}>
                  <p className={estilos.cardNome}>{c.responsavelNome ?? '—'}</p>
                  {c.possivelDuplicata && (
                    <span className={`${estilos.selo} ${estilos.seloDuplicata}`}>Possível duplicata</span>
                  )}
                </div>
                <p className="texto-apoio">
                  {c.comunidadeNome ?? '—'}
                  {!c.comunidadeId && ' (não reconhecida)'} · {c.totalPessoas}{' '}
                  {c.totalPessoas === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <p className={estilos.cardRodape}>
                  enviado por {c.agenteNome} · {dataHora(c.recebidoEm)}
                </p>
              </div>
              <Link href={`/chamados/${c.id}`} className="botao botao--primario">
                {c.situacao === 'PENDENTE' ? 'Revisar' : 'Ver'}
              </Link>
            </div>
          ))}
        </div>
      )}

      {lista && lista.length > 0 && (
        <Paginacao
          rotulo="chamados"
          pagina={pagina}
          porPagina={porPagina}
          total={lista.length}
          onPagina={setPagina}
          onPorPagina={(n) => { setPorPagina(n); setPagina(0); }}
        />
      )}

      {aba === 'PENDENTE' && (
        <Aviso titulo="Por que existe esta fila">
          A agente coleta em campo, mas quem decide o que entra na base continua sendo você. O app
          só trouxe a coleta para o celular — a aprovação continua sendo sua, cadastro por cadastro.
        </Aviso>
      )}
    </section>
  );
}
