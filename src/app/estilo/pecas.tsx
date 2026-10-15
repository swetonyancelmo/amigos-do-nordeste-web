'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/* Peças de montagem da página /estilo. Nada daqui vai para as telas. */

export function Secao({ id, titulo, children, descricao }: {
  id: string;
  titulo: string;
  descricao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 border-t py-10 first-of-type:border-t-0">
      <h2 id={`${id}-titulo`} className="font-heading text-2xl font-extrabold">{titulo}</h2>
      {descricao && <div className="mt-2 max-w-3xl text-muted-foreground">{descricao}</div>}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  );
}

export const ESTADOS = ['Normal', 'Foco', 'Erro', 'Desabilitado', 'Carregando'] as const;

/**
 * Uma linha da grade de estados: o mesmo componente em cada estado. No
 * celular vira coluna, com o nome do estado em cima de cada um.
 */
export function LinhaDeEstados({ nome, estados, largo = false }: {
  nome: string;
  estados: Record<(typeof ESTADOS)[number], React.ReactNode>;
  /** Componente que não cabe em 1/5 da largura (abas, paginação): duas colunas. */
  largo?: boolean;
}) {
  return (
    <div role="group" aria-label={nome} className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-bold">{nome}</h3>
      <div className={cn('grid grid-cols-1 gap-4', largo ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-5')}>
        {ESTADOS.map((estado) => (
          <div key={estado} className="flex min-w-0 flex-col gap-2">
            <span className="text-[0.8rem] font-bold tracking-wide text-muted-foreground uppercase">{estado}</span>
            <div className="flex min-h-10 flex-wrap items-start gap-2">{estados[estado]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NaoSeAplica({ porque }: { porque: string }) {
  return <span className="text-[0.8rem] text-muted-foreground italic">Não se aplica: {porque}</span>;
}

/** Converte qualquer cor CSS (inclusive oklch) para o HEX que a tela mostra de fato. */
function hexNaTela(cor: string): string {
  const tela = document.createElement('canvas');
  tela.width = tela.height = 1;
  const contexto = tela.getContext('2d');
  if (!contexto) return '';
  contexto.fillStyle = cor;
  contexto.fillRect(0, 0, 1, 1);
  const [r, g, b] = contexto.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/**
 * Amostra de cor de um token. O HEX é medido no navegador a partir do valor
 * OKLCH em vigor: é a prova de que a conversão não mudou a cor (compare com
 * o HEX do comentário em tokens-amigos-do-nordeste.css e com o Paper).
 */
export function Amostra({ token }: { token: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hex, setHex] = useState('');
  useEffect(() => {
    if (ref.current) setHex(hexNaTela(getComputedStyle(ref.current).backgroundColor));
  }, []);
  return (
    <div className="flex items-center gap-3" data-token={token} data-hex={hex}>
      <span ref={ref} className="size-10 shrink-0 rounded-md border" style={{ background: `var(--${token})` }} />
      <span className="min-w-0">
        <code className="block truncate text-[0.8rem]">--{token}</code>
        <span className="font-mono text-[0.8rem] text-muted-foreground">{hex || '…'}</span>
      </span>
    </div>
  );
}

/** Mostra, medido na tela, o tamanho em px de uma classe de texto do Tailwind. */
export function TamanhoMedido({ classe, children }: { classe: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [px, setPx] = useState('');
  useEffect(() => {
    if (ref.current) setPx(getComputedStyle(ref.current).fontSize);
  }, []);
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <code className="w-24 shrink-0 text-[0.8rem] text-muted-foreground">{classe}</code>
      <span ref={ref} className={cn(classe)}>{children}</span>
      <span className="font-mono text-[0.8rem] text-muted-foreground">{px}</span>
    </div>
  );
}
