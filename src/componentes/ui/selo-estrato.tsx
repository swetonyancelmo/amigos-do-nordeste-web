import { cva } from 'class-variance-authority';
import { Marcador } from '@/componentes/vulnerabilidade/SeloEstrato';
import { cn } from '@/lib/utils';

/*
 * Selo do estrato de vulnerabilidade na interface nova (Tailwind + tokens).
 * Substitui `vulnerabilidade/SeloEstrato` quando as telas migrarem; até lá,
 * só a página /estilo usa este.
 *
 * As mesmas regras do selo antigo, que não podem ser quebradas:
 *  1. O TEXTO é a informação e vem da API (`rotulo`). Nada de rótulo aqui.
 *  2. A aparência sai do CÓDIGO do estrato, nunca do texto.
 *  3. A cor nunca informa sozinha. Cada estrato difere também em borda
 *     (grossa, fina, tracejada), preenchimento e ÍCONE (o mesmo de hoje:
 *     barras de 3 a 0, e "!" para cadastro a completar). Tem que continuar
 *     legível impresso em preto e branco: a Priorização vai para o campo
 *     em papel.
 *  4. DADOS_INSUFICIENTES é pendência que pede ação, nunca "sem risco":
 *     fundo âmbar, borda tracejada, ícone de alerta. Nunca cinza.
 *
 * Fonte de 12px (0,8rem: aqui 1rem = 15px). Menor que isso o projeto não usa.
 */
const seloEstrato = cva(
  'inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5 pr-2.5 pl-2 text-[0.8rem] leading-tight font-bold [print-color-adjust:exact]',
  {
    variants: {
      estrato: {
        R3: 'border-2 border-estrato-r3-border bg-estrato-r3 text-estrato-r3-foreground',
        R2: 'border-2 border-estrato-r2-border bg-estrato-r2 text-estrato-r2-foreground',
        R1: 'border border-estrato-r1-border bg-estrato-r1 text-estrato-r1-foreground',
        DADOS_INSUFICIENTES:
          'border-2 border-dashed border-estrato-pendente-border bg-estrato-pendente text-estrato-pendente-foreground',
        SEM_RISCO_IDENTIFICADO: 'border border-estrato-sem-border bg-estrato-sem text-estrato-sem-foreground',
        // Código que este front não conhece: o rótulo da API, sem ícone nem cor de estrato.
        desconhecido: 'border border-dotted border-muted-foreground bg-card text-foreground',
      },
    },
    defaultVariants: { estrato: 'desconhecido' },
  },
);

const CONHECIDOS = new Set(['R3', 'R2', 'R1', 'DADOS_INSUFICIENTES', 'SEM_RISCO_IDENTIFICADO']);

type Props = React.ComponentProps<'span'> & {
  /** Código do estrato, como a API manda (R3, R2, R1, DADOS_INSUFICIENTES…). */
  estrato: string;
  /** O texto que a API mandou. Se vier vazio, mostra o código. */
  rotulo: string;
};

function SeloEstrato({ estrato, rotulo, className, ...props }: Props) {
  const variante = (CONHECIDOS.has(estrato) ? estrato : 'desconhecido') as 'desconhecido';
  return (
    <span
      data-slot="selo-estrato"
      data-estrato={estrato}
      className={cn(seloEstrato({ estrato: variante }), className)}
      {...props}
    >
      <Marcador estrato={estrato} />
      <span>{rotulo || estrato}</span>
    </span>
  );
}

export { SeloEstrato, seloEstrato };
