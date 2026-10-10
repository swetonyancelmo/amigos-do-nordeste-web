import Link from 'next/link';
import type { ContagemEstrato } from '@/tipos/dominio';
import { DADOS_INSUFICIENTES } from '@/lib/vulnerabilidade';
import { SeloEstrato } from './SeloEstrato';
import styles from './DistribuicaoEstratos.module.css';

/*
 * Quantas famílias em cada estrato, uma linha por estrato, na ordem que a API
 * mandou: selo | barra | quantidade | percentual, em colunas fixas para as
 * linhas se alinharem. Usado no Início e na Priorização.
 *
 * A barra tem a cor e o padrão do estrato, mas é só reforço: o número e o
 * texto do selo são a informação. A de "a completar" é hachurada, para não
 * se confundir com nenhum estrato da escala nem no papel.
 */

const CLASSE_BARRA: Record<string, string> = {
  R3: styles.barraR3,
  R2: styles.barraR2,
  R1: styles.barraR1,
  SEM_RISCO_IDENTIFICADO: styles.barraSemRisco,
  DADOS_INSUFICIENTES: styles.barraCompletar,
};

type Props = {
  distribuicao: ContagemEstrato[];
  /** Para onde leva o número de cada estrato (a lista filtrada). Sem isso, o número é texto. */
  linkPara?: (estrato: string) => string;
};

export function DistribuicaoEstratos({ distribuicao, linkPara }: Props) {
  return (
    <ul className={styles.lista}>
      {distribuicao.map((c) => {
        const completar = c.estrato === DADOS_INSUFICIENTES;
        const texto = completar
          ? `${c.valor.toLocaleString('pt-BR')} a completar`
          : `${c.valor.toLocaleString('pt-BR')} ${c.valor === 1 ? 'família' : 'famílias'}`;
        return (
          <li key={c.estrato} className={completar ? `${styles.linha} ${styles.linhaCompletar}` : styles.linha}>
            <span className={styles.selo}>
              <SeloEstrato estrato={c.estrato} rotulo={c.rotulo} />
            </span>
            <span className={styles.barraFundo} aria-hidden="true">
              <span
                className={`${styles.barra} ${CLASSE_BARRA[c.estrato] ?? styles.barraOutro}`}
                style={{ width: `${Math.min(100, Math.max(0, c.percentual))}%` }}
              />
            </span>
            <span className={styles.valor}>
              {linkPara && c.valor > 0 ? (
                <Link href={linkPara(c.estrato)}>
                  {texto}
                  {completar && <span className={styles.acao}> — ver a lista</span>}
                </Link>
              ) : (
                texto
              )}
            </span>
            <span className={styles.percentual}>{c.percentual.toLocaleString('pt-BR')}%</span>
          </li>
        );
      })}
    </ul>
  );
}
