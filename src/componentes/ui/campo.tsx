import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

type Props = React.ComponentProps<typeof Input> & {
  rotulo: string;
  /** Texto curto abaixo do campo. Some quando há erro. */
  ajuda?: string;
  /** Mensagem de validação deste campo. Marca o input como inválido. */
  erro?: string;
};

/**
 * O par do `Campo` antigo na interface nova, com as mesmas props: rótulo,
 * `id`, `aria-describedby` e estado inválido já ligados. O erro se diz em
 * texto, ao lado do campo; a cor só reforça.
 */
export function Campo({
  rotulo,
  ajuda,
  erro,
  id,
  className,
  'aria-describedby': descritoPor,
  'aria-invalid': invalido,
  ...resto
}: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idApoio = `${idCampo}-apoio`;
  const apoio = erro ?? ajuda;
  const descricoes = [descritoPor, apoio ? idApoio : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={idCampo} className="font-semibold">
        {rotulo}
      </Label>
      <Input
        {...resto}
        id={idCampo}
        className={className}
        aria-invalid={erro ? true : invalido}
        aria-describedby={descricoes}
      />
      {apoio && (
        <span
          id={idApoio}
          className={cn('text-[0.8rem]', erro ? 'font-semibold text-destructive' : 'text-muted-foreground')}
        >
          {apoio}
        </span>
      )}
    </div>
  );
}
