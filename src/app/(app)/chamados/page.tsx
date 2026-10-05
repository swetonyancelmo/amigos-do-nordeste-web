'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
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

const ID_PAINEL = 'painel-chamados';
const idAba = (valor: SituacaoPreCadastro) => `aba-chamados-${valor}`;

/** "Revisar"/"Ver" com contexto para o leitor de tela: há um por card (WCAG 2.4.6). */
function rotuloAcao(c: PreCadastroResumo) {
  const acao = c.situacao === 'PENDENTE' ? 'Revisar' : 'Ver';
  return c.responsavelNome ? `${acao} chamado de ${c.responsavelNome}` : `${acao} chamado sem nome de responsável`;
}

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
  const refsAbas = useRef<Partial<Record<SituacaoPreCadastro, HTMLButtonElement | null>>>({});

  useEffect(() => {
    let ativo = true;
    api.get<PreCadastroResumo[]>('/pre-cadastros')
      .then((r) => { if (ativo) setTodos(r); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
    return () => { ativo = false; };
  }, []);

  function escolherAba(valor: SituacaoPreCadastro) {
    setAba(valor);
    setPagina(0);
  }

  /** Padrão de abas: ← → andam (dando a volta), Home e End vão às pontas; a aba ativa e o foco andam juntos. */
  function teclaNasAbas(evento: KeyboardEvent<HTMLDivElement>) {
    const atual = ABAS.findIndex((a) => a.valor === aba);
    const destinos: Record<string, number> = {
      ArrowRight: (atual + 1) % ABAS.length,
      ArrowLeft: (atual - 1 + ABAS.length) % ABAS.length,
      Home: 0,
      End: ABAS.length - 1,
    };
    if (!(evento.key in destinos)) return;
    evento.preventDefault();
    const nova = ABAS[destinos[evento.key]].valor;
    escolherAba(nova);
    refsAbas.current[nova]?.focus();
  }

  const porSituacao = (s: SituacaoPreCadastro) => (todos ?? []).filter((c) => c.situacao === s);
  const lista = todos ? porSituacao(aba) : null;

  return (
    <section className={estilos.pagina}>
      <p className="texto-apoio">
        Cadastros enviados pelas agentes de saúde. Nada entra na base de famílias sem você aprovar.
      </p>

      <div className={estilos.abas} role="tablist" aria-label="Situação dos chamados" onKeyDown={teclaNasAbas}>
        {ABAS.map((a) => (
          <button
            key={a.valor}
            ref={(el) => { refsAbas.current[a.valor] = el; }}
            id={idAba(a.valor)}
            type="button"
            role="tab"
            aria-selected={aba === a.valor}
            aria-controls={ID_PAINEL}
            tabIndex={aba === a.valor ? 0 : -1}
            className={aba === a.valor ? `${estilos.aba} ${estilos.abaAtiva}` : estilos.aba}
            onClick={() => escolherAba(a.valor)}
          >
            {a.rotulo} · {todos ? porSituacao(a.valor).length : '—'}
          </button>
        ))}
      </div>

      {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}

      {/* tabIndex 0: o painel pode começar sem nada focável (lista vazia, carregando). */}
      <div id={ID_PAINEL} role="tabpanel" aria-labelledby={idAba(aba)} tabIndex={0} className={estilos.painel}>
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
                <Link
                  href={`/chamados/${c.id}`}
                  className="botao botao--primario"
                  aria-label={rotuloAcao(c)}
                >
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
      </div>
    </section>
  );
}
