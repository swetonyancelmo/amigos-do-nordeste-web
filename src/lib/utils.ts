import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes do Tailwind resolvendo conflito (a última ganha):
 * `cn('px-2', condicao && 'px-4')`. É o que os componentes de
 * `src/componentes/ui/` (shadcn/ui) importam.
 *
 * O shadcn 4.21 gera `export { cn } from "cn"`, um pacote novo (set/2026).
 * Ficamos com clsx + tailwind-merge, o par de anos que ele substitui com a
 * mesma assinatura.
 */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}
