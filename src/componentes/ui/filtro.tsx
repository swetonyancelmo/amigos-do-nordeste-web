'use client';

import { CheckIcon, FunnelIcon, XIcon } from 'lucide-react';
import { useId } from 'react';
import { IconeBusca } from '@/componentes/Icones';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { cn } from '@/lib/utils';
import type { Opcao } from '@/tipos/dominio';

/*
 * Filtro de lista na interface nova. Famílias foi a primeira tela; Pessoas,
 * Comunidades, Relatórios e Priorização repetem estas peças em vez de
 * desenhar o próprio select ou a própria busca (achado C2 do diagnóstico).
 *
 *  - Todo filtro tem RÓTULO VISÍVEL. Placeholder não é rótulo: some ao
 *    digitar, e quem usa ditado precisa de um nome na tela para falar.
 *  - Filtro ativo não se distingue só pela cor: ganha borda grossa, negrito
 *    e um ícone (funil no select, visto no botão de alternar).
 *  - Estas peças só desenham. Quem filtra é a API: a tela manda o valor na
 *    consulta e, se ele precisa sobreviver ao recarregar, na URL.
 */

/** Fileira dos filtros: quebra linha no celular, alinhada pela base no desktop. */
export function BarraFiltros({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="group" aria-label="Filtros" className={cn('flex flex-wrap items-end gap-3', className)}>
      {children}
    </div>
  );
}

const ROTULO = 'text-sm font-semibold text-foreground';

type PropsBusca = Omit<React.ComponentProps<typeof Input>, 'type' | 'id'> & {
  rotulo: string;
};

/** Campo de busca com rótulo em cima e lupa dentro. */
export function FiltroBusca({ rotulo, className, ...props }: PropsBusca) {
  const id = useId();
  return (
    <div className={cn('grid w-full gap-1.5', className)}>
      <Label htmlFor={id} className={ROTULO}>
        {rotulo}
      </Label>
      <div className="relative">
        <IconeBusca
          tamanho={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input id={id} type="search" className="bg-card pl-10" {...props} />
      </div>
    </div>
  );
}

/*
 * O Select do Radix não aceita item com valor vazio, e o "todas" das telas é
 * valor vazio (some da URL). Este marcador faz a ponte só aqui dentro.
 */
const VAZIO = '__todas__';

type PropsSelecao = {
  rotulo: string;
  valor: string;
  onValor: (valor: string) => void;
  /** As opções: de `useMetadados()`, da API ou montadas pela tela. */
  opcoes: Opcao[];
  /** Texto da opção de valor vazio ("Todas as comunidades"). Sem ele, não há opção vazia. */
  opcaoVazia?: string;
  /** Se o filtro está restringindo a lista. Padrão: valor diferente de vazio. */
  ativo?: boolean;
  className?: string;
};

/** Lista de escolha com rótulo em cima; quando filtra, mostra o funil e a borda grossa. */
export function FiltroSelecao({ rotulo, valor, onValor, opcoes, opcaoVazia, ativo = valor !== '', className }: PropsSelecao) {
  const id = useId();
  return (
    <div className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5 celular:w-full', className)}>
      <Label htmlFor={id} className={ROTULO}>
        {rotulo}
      </Label>
      <Select value={valor || VAZIO} onValueChange={(v) => onValor(v === VAZIO ? '' : v)}>
        <SelectTrigger
          id={id}
          data-ativo={ativo || undefined}
          className={cn(
            'w-full bg-card data-ativo:border-2 data-ativo:border-primary data-ativo:font-semibold',
            // Valor numa linha só, cortado com reticências; o funil (quando há) fica à esquerda.
            'justify-start *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:block',
            '*:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate *:data-[slot=select-value]:text-left',
          )}
        >
          {ativo && <FunnelIcon aria-hidden="true" className="text-primary" />}
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-80">
          {opcaoVazia && <SelectItem value={VAZIO}>{opcaoVazia}</SelectItem>}
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const PILULA = 'rounded-full border-border bg-card font-normal';
const PILULA_ATIVA = 'border-2 border-primary bg-accent font-semibold text-accent-foreground hover:bg-accent';

type PropsAlternar = {
  ativo: boolean;
  onAlternar: () => void;
  children: React.ReactNode;
};

/** Filtro liga/desliga ("Sem banheiro"). aria-pressed para o leitor de tela; visto para quem vê. */
export function FiltroAlternar({ ativo, onAlternar, children }: PropsAlternar) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={ativo}
      onClick={onAlternar}
      className={cn(PILULA, ativo && PILULA_ATIVA)}
    >
      {ativo && <CheckIcon aria-hidden="true" />}
      {children}
    </Button>
  );
}

type PropsRemovivel = {
  /** Nome para o leitor de tela, dizendo o que o clique faz ("Tirar o filtro de município X"). */
  rotuloRemover: string;
  onRemover: () => void;
  children: React.ReactNode;
};

/** Filtro que chegou de fora (link de outra tela) e aqui só se desfaz. */
export function FiltroRemovivel({ rotuloRemover, onRemover, children }: PropsRemovivel) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onRemover}
      aria-label={rotuloRemover}
      className={cn(PILULA, PILULA_ATIVA)}
    >
      {children}
      <XIcon aria-hidden="true" />
    </Button>
  );
}
