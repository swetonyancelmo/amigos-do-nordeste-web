'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Botao } from '@/componentes/Botao';

/**
 * Telas 04 e 05 do Figma — necessidades da comunidade.
 *
 * TODO(equipe frontend):
 *  - GET /api/relatorios/necessidades?comunidadeId=... para as barras por tamanho;
 *  - GET /api/relatorios/situacao para os cartões de vulnerabilidade;
 *  - o @media print de componentes.css já esconde navegação e ações — falta
 *    só afinar cada relatório na folha.
 */

// Fora do componente: JSX estável, o cabeçalho não re-renderiza à toa.
const ACOES = (
  <Botao variante="secundario" onClick={() => window.print()}>
    Imprimir
  </Botao>
);

export default function Relatorios() {
  useCabecalho('Relatórios', ACOES);

  return <p>Relatórios — a implementar.</p>;
}
