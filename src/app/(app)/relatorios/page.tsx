'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Botao } from '@/componentes/Botao';

/**
 * Telas 04 e 05 do Figma — necessidades da comunidade.
 *
 * TODO(equipe frontend):
 *  - GET /api/relatorios/necessidades?comunidadeId=... para as barras por tamanho;
 *  - GET /api/relatorios/situacao para os cartões de vulnerabilidade;
 *  - o botão Imprimir usa window.print(); o @media print de componentes.css
 *    já esconde navegação e ações — falta só afinar cada relatório na folha.
 */
export default function Relatorios() {
  useCabecalho('Relatórios', <Botao variante="secundario">Imprimir</Botao>);

  return <p>Relatórios — a implementar.</p>;
}
