'use client';

import { useEffect, useId, useState } from 'react';
import { Carregando, FalhaAoCarregar, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { api } from '@/lib/api';
import { ANCORA_COMO_CALCULA, DOI_INSTRUMENTO, REFERENCIA_INSTRUMENTO } from '@/lib/vulnerabilidade';
import type { BaseVulnerabilidade, FaixaSentinela } from '@/tipos/dominio';
import { SeloEstrato } from './SeloEstrato';
import styles from './ComoECalculada.module.css';

/*
 * "De onde vem esta prioridade": a tabela do instrumento, com os valores EM
 * USO, vindos de GET /api/vulnerabilidade/base. Nada é escrito nem calculado
 * aqui: se a associação ajustar um peso, a tabela muda junto. Os valores
 * originais do artigo e as adaptações estão na ADR-0010 da API.
 *
 * Na tela fica recolhido (é consulta, não é o dia a dia); no papel sai
 * sempre, para a folha impressa se explicar sozinha quando circular.
 */

const OPERADOR: Record<FaixaSentinela['operador'], string> = {
  MAIOR: 'mais de',
  IGUAL: 'exatamente',
  MENOR: 'menos de',
};

function descreverFaixa(f: FaixaSentinela) {
  const limite = f.limite.toLocaleString('pt-BR');
  const morador = f.limite === 1 ? 'morador' : 'moradores';
  return `${OPERADOR[f.operador]} ${limite} ${morador} por cômodo: ${f.pontos} ${f.pontos === 1 ? 'ponto' : 'pontos'}`;
}

function faixaDeEscore(minimo: number | null, maximo: number | null) {
  if (minimo === null) return 'sem soma: falta dado';
  if (maximo === null) return `${minimo} ou mais`;
  if (minimo === maximo) return String(minimo);
  return `${minimo} a ${maximo}`;
}

const pontos = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

type Props = {
  /** Classe extra do container (a Priorização a usa para mandá-lo ao fim da folha impressa). */
  className?: string;
};

export function ComoECalculada({ className }: Props) {
  const idConteudo = useId();
  const [aberto, setAberto] = useState(false);
  const [base, setBase] = useState<BaseVulnerabilidade | null>(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  // Quem chega pelo link da ficha ("ver a tabela completa") já encontra aberto.
  useEffect(() => {
    if (window.location.hash === `#${ANCORA_COMO_CALCULA}`) setAberto(true);
  }, []);

  useEffect(() => {
    let ativo = true;
    setErro('');
    api
      .get<BaseVulnerabilidade>('/vulnerabilidade/base')
      .then((b) => ativo && setBase(b))
      .catch((e) => ativo && setErro(mensagemDeFalha(e, 'Não foi possível carregar as regras do cálculo. Tente de novo.')));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  return (
    <section id={ANCORA_COMO_CALCULA} className={className ? `${styles.secao} ${className}` : styles.secao} aria-labelledby={`${idConteudo}-titulo`}>
      <div className={styles.topo}>
        <h2 id={`${idConteudo}-titulo`} className={styles.titulo}>Como a prioridade é calculada</h2>
        <button
          type="button"
          className={`${styles.alternar} nao-imprime`}
          aria-expanded={aberto}
          aria-controls={idConteudo}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? 'Esconder a tabela' : 'Ver a tabela'}
        </button>
      </div>

      <div id={idConteudo} className={aberto ? styles.conteudo : `${styles.conteudo} ${styles.recolhido}`}>
        {erro ? (
          <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />
        ) : !base ? (
          <Carregando mensagem="Carregando as regras do cálculo" linhas={4} />
        ) : (
          <>
            <p className={styles.texto}>
              Cada situação abaixo, se aparece no cadastro da família, soma pontos. A soma indica a prioridade
              sugerida. Se falta dado para saber se uma situação existe, ela não soma e não conta como &quot;não
              tem&quot;; quando isso pode mudar o resultado, a família fica em &quot;completar cadastro&quot;.
              Com estas regras, uma família soma no máximo {pontos(base.escoreMaximoAlcancavel)}.
            </p>

            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <caption className={styles.legenda}>Situações que somam pontos</caption>
                <thead>
                  <tr>
                    <th scope="col">Situação (nome no artigo)</th>
                    <th scope="col" className={styles.colPontos}>Pontos</th>
                    <th scope="col">Como o cadastro é lido</th>
                  </tr>
                </thead>
                <tbody>
                  {base.sentinelas.map((s) => (
                    <tr key={s.codigo}>
                      <th scope="row">{s.nome}</th>
                      <td className={styles.colPontos} data-rotulo="Pontos">
                        {s.tipo === 'FAIXA' ? (
                          <ul className={styles.faixas}>
                            {s.faixas.map((f) => <li key={`${f.operador}-${f.limite}`}>{descreverFaixa(f)}</li>)}
                          </ul>
                        ) : (
                          s.pontos
                        )}
                      </td>
                      <td data-rotulo="Como o cadastro é lido">{s.criterio ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <caption className={styles.legenda}>Da soma à prioridade sugerida</caption>
                <thead>
                  <tr>
                    <th scope="col">Prioridade sugerida</th>
                    <th scope="col" className={styles.colPontos}>Soma de pontos</th>
                    <th scope="col">No instrumento</th>
                  </tr>
                </thead>
                <tbody>
                  {base.estratos.map((e) => (
                    <tr key={e.estrato}>
                      <td><SeloEstrato estrato={e.estrato} rotulo={e.rotulo} /></td>
                      <td className={styles.colPontos} data-rotulo="Soma de pontos">
                        {faixaDeEscore(e.escoreMinimo, e.escoreMaximo)}
                      </td>
                      <td data-rotulo="No instrumento">{e.descricaoInstrumento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {base.sentinelasNaoAvaliadas.length > 0 && (
              <div className={styles.rolagem}>
                <table className={styles.tabela}>
                  <caption className={styles.legenda}>O que a escala original considera e o sistema não usa</caption>
                  <thead>
                    <tr>
                      <th scope="col">Situação (nome no artigo)</th>
                      <th scope="col" className={styles.colPontos}>Pontos no artigo</th>
                      <th scope="col">Por que fica de fora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {base.sentinelasNaoAvaliadas.map((s) => (
                      <tr key={s.codigo}>
                        <th scope="row">{s.nome}</th>
                        <td className={styles.colPontos} data-rotulo="Pontos no artigo">{s.pontos ?? '—'}</td>
                        <td data-rotulo="Por que fica de fora">{s.justificativa ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className={styles.nota}>
              Os valores acima são os em uso no sistema. Os originais do artigo e cada adaptação feita para o
              cadastro da associação estão documentados nas decisões do projeto (ADR-0010).
            </p>
            <p className={styles.nota}>
              <strong>Fonte:</strong> {REFERENCIA_INSTRUMENTO}{' '}
              <a href={DOI_INSTRUMENTO} target="_blank" rel="noopener noreferrer">
                doi.org/10.5712/rbmfc1(2)104
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
