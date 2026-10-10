import type { EstratoRisco } from '@/tipos/dominio';
import styles from './SeloEstrato.module.css';

/*
 * O selo do estrato de vulnerabilidade (ADR-0010 da API).
 *
 * Três regras, nesta ordem:
 *  1. O TEXTO é a informação, e vem da API (`rotulo`, configurável pela
 *     associação). Nada de rótulo escrito aqui.
 *  2. A aparência sai do CÓDIGO (R3, R2…), nunca do texto, que pode mudar.
 *  3. Cor é só reforço. Cada estrato tem também borda e marcador próprios,
 *     para continuar legível impresso em laser e para quem não distingue
 *     cores:
 *       R3                     fundo escuro, borda grossa, ▮▮▮
 *       R2                     fundo claro, borda grossa, ▮▮▯
 *       R1                     fundo claro, borda fina, ▮▯▯
 *       DADOS_INSUFICIENTES    amarelo, borda TRACEJADA grossa, "!"
 *       SEM_RISCO_IDENTIFICADO branco, borda fina, ▯▯▯
 *     DADOS_INSUFICIENTES é pendência, não "sem risco": nunca cinza, nunca
 *     parecido com o selo de sem risco.
 *  Código que este front não conhece: rótulo da API em estilo neutro, sem
 *  marcador. Não quebra e não fica vazio.
 */

const NIVEIS: Record<string, number> = { R3: 3, R2: 2, R1: 1, SEM_RISCO_IDENTIFICADO: 0 };

const CLASSE: Record<string, string> = {
  R3: styles.r3,
  R2: styles.r2,
  R1: styles.r1,
  SEM_RISCO_IDENTIFICADO: styles.semRisco,
  DADOS_INSUFICIENTES: styles.dadosInsuficientes,
};

function Marcador({ estrato }: { estrato: string }) {
  if (estrato === 'DADOS_INSUFICIENTES') {
    return (
      <svg className={styles.marcador} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 4v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="11.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  const nivel = NIVEIS[estrato];
  if (nivel === undefined) return null;
  return (
    <svg className={styles.marcador} viewBox="0 0 20 16" aria-hidden="true" focusable="false">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1 + i * 6.5}
          y={10 - i * 4}
          width="5"
          height={5 + i * 4}
          rx="1"
          fill={i < nivel ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.3"
        />
      ))}
    </svg>
  );
}

type Props = {
  estrato: EstratoRisco;
  /** O texto que a API mandou. Vazio não acontece, mas se vier, mostra o código. */
  rotulo: string;
  tamanho?: 'normal' | 'grande';
};

export function SeloEstrato({ estrato, rotulo, tamanho = 'normal' }: Props) {
  const classes = [styles.selo, CLASSE[estrato] ?? styles.desconhecido];
  if (tamanho === 'grande') classes.push(styles.grande);

  return (
    <span className={classes.join(' ')} data-estrato={estrato}>
      <Marcador estrato={estrato} />
      <span>{rotulo || estrato}</span>
    </span>
  );
}
