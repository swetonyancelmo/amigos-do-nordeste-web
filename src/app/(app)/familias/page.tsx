'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Botao } from '@/componentes/Botao';

/**
 * Tela 02 do Figma — lista de famílias.
 *
 * TODO(equipe frontend): implementar a partir do frame "02 · Lista de famílias".
 * Pontos que não são detalhe de visual e precisam sobreviver à implementação:
 *  - a busca é pelo NOME DA RESPONSÁVEL (é assim que a associação pensa);
 *  - os totais de cada linha vêm calculados da API, em `familia.totais`;
 *  - nada de scroll infinito: paginação simples, que funciona mal na internet ruim.
 */
export default function Familias() {
  useCabecalho('Famílias', <Botao>Nova família</Botao>);

  return <p>Lista de famílias — a implementar.</p>;
}
