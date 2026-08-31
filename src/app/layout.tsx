import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadastro de Famílias · Amigos do Nordeste',
  description: 'Sistema de cadastro das famílias atendidas pela Associação Amigos do Nordeste.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
