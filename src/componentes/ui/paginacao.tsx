'use client';

import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useId } from 'react';
import { TAMANHOS_PAGINA } from '@/componentes/Paginacao';
import { Button } from '@/componentes/ui/button';
import { Label } from '@/componentes/ui/label';
import { Pagination, PaginationContent, PaginationItem } from '@/componentes/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';

/*
 * Rodapé de lista na interface nova: o mesmo `Paginacao` de
 * src/componentes/Paginacao.tsx (mesmas props, mesmos textos), montado com
 * os primitivos. O antigo continua nas telas não migradas (Pessoas,
 * Comunidades, Chamados, Agentes); ao migrar uma delas, troque só o import.
 *
 * Do `Pagination` do shadcn vem a moldura (<nav> + lista). Os números de
 * página dele não servem aqui: são links, e a página destas listas é estado
 * da tela, pedido à API, não um endereço. Ficam as quatro setas e o
 * "Página x de y", como antes.
 */
type Props = {
  /** Página atual, começando em 0 (igual à API). */
  pagina: number;
  porPagina: number;
  /** Total de itens, de todas as páginas. */
  total: number;
  onPagina: (pagina: number) => void;
  /** Trocar o tamanho volta para a primeira página. */
  onPorPagina: (porPagina: number) => void;
  /** Para o leitor de tela: "Paginação da lista de {rotulo}". */
  rotulo: string;
};

const numero = (n: number) => n.toLocaleString('pt-BR');

function Seta({ rotulo, desabilitada, onClick, children }: {
  rotulo: string;
  desabilitada: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <PaginationItem>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={desabilitada}
        onClick={onClick}
        aria-label={rotulo}
        title={rotulo}
      >
        {children}
      </Button>
    </PaginationItem>
  );
}

export function Paginacao({ pagina, porPagina, total, onPagina, onPorPagina, rotulo }: Props) {
  const idTamanho = useId();
  const totalPaginas = Math.max(Math.ceil(total / porPagina), 1);
  const ultima = totalPaginas - 1;
  const primeiroItem = total === 0 ? 0 : pagina * porPagina + 1;
  const ultimoItem = Math.min((pagina + 1) * porPagina, total);
  const noInicio = pagina <= 0;
  const noFim = pagina >= ultima;

  // Removeu o último item da última página: volta para a que ainda existe.
  useEffect(() => {
    if (pagina > ultima) onPagina(ultima);
  }, [pagina, ultima, onPagina]);

  return (
    <Pagination
      aria-label={`Paginação da lista de ${rotulo}`}
      className="mx-0 flex-wrap items-center justify-end gap-x-6 gap-y-3 pt-4 text-sm text-muted-foreground celular:justify-between"
    >
      <div className="flex items-center gap-2">
        <Label htmlFor={idTamanho} className="text-sm font-normal text-muted-foreground">
          Itens por página:
        </Label>
        <Select value={String(porPagina)} onValueChange={(v) => onPorPagina(Number(v))}>
          <SelectTrigger id={idTamanho} className="bg-card font-bold text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {TAMANHOS_PAGINA.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span aria-live="polite" className="*:font-bold *:text-foreground">
        <strong>{numero(primeiroItem)}</strong> a <strong>{numero(ultimoItem)}</strong> de{' '}
        <strong>{numero(total)}</strong>
      </span>

      {/* No celular o "Página x de y" sobe para uma linha própria: as quatro
          setas e o texto juntos não cabem em 320px. */}
      <PaginationContent className="gap-1 celular:w-full celular:flex-wrap celular:justify-center">
        <Seta rotulo="Primeira página" desabilitada={noInicio} onClick={() => onPagina(0)}>
          <ChevronFirstIcon aria-hidden="true" />
        </Seta>
        <Seta rotulo="Página anterior" desabilitada={noInicio} onClick={() => onPagina(pagina - 1)}>
          <ChevronLeftIcon aria-hidden="true" />
        </Seta>
        <li className="px-2 whitespace-nowrap *:font-bold *:text-foreground celular:order-first celular:basis-full celular:text-center">
          Página <strong>{numero(pagina + 1)}</strong> de <strong>{numero(totalPaginas)}</strong>
        </li>
        <Seta rotulo="Próxima página" desabilitada={noFim} onClick={() => onPagina(pagina + 1)}>
          <ChevronRightIcon aria-hidden="true" />
        </Seta>
        <Seta rotulo="Última página" desabilitada={noFim} onClick={() => onPagina(ultima)}>
          <ChevronLastIcon aria-hidden="true" />
        </Seta>
      </PaginationContent>
    </Pagination>
  );
}

/** Fatia de uma lista que a API devolve inteira (chamados, agentes). */
export function paginarNoCliente<T>(lista: T[], pagina: number, porPagina: number): T[] {
  return lista.slice(pagina * porPagina, (pagina + 1) * porPagina);
}
