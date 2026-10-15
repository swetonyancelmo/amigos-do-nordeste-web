import type { Metadata } from 'next';
import { Vitrine } from './Vitrine';

/*
 * /estilo: onde o time aprova o visual da interface nova (Tailwind +
 * shadcn/ui + tokens da associação) antes de qualquer tela mudar.
 *
 * Fora do grupo (app): não pede login, porque não fala com a API e só tem
 * exemplo inventado. Nada de dado real de família aqui, nem CPF ou telefone,
 * nem de exemplo.
 */
export const metadata: Metadata = {
  title: 'Estilo · Amigos do Nordeste',
  description: 'Componentes da interface nova, em todos os estados, para aprovação do time.',
  robots: { index: false, follow: false },
};

export default function PaginaEstilo() {
  return <Vitrine />;
}
