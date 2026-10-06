'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { FormularioFamilia } from '@/componentes/familia/FormularioFamilia';
import { formularioVazio, montarCorpoCriacao, type Formulario } from '@/componentes/familia/formularioFamilia';
import { api } from '@/lib/api';
import type { FamiliaGravada } from '@/tipos/dominio';

const ACOES = (
  <Link href="/familias" className="botao botao--secundario">
    Voltar para a lista
  </Link>
);

/**
 * Cadastro de família pelo painel (`POST /api/familias`): responsável,
 * moradia, as pessoas da casa e a renda, numa chamada só.
 *
 * Feita para digitar rápido uma pilha de fichas de papel: Enter salva e o
 * formulário volta limpo, com a mesma comunidade, pronto para a próxima.
 */
export default function NovaFamilia() {
  useCabecalho('Nova família', ACOES);

  const [inicial] = useState(() => formularioVazio());
  const [salva, setSalva] = useState<FamiliaGravada | null>(null);

  async function cadastrar(form: Formulario) {
    const familia = await api.post<FamiliaGravada>('/familias', montarCorpoCriacao(form));
    setSalva(familia);
    // A próxima ficha quase sempre é da mesma comunidade.
    return formularioVazio(form.comunidadeId);
  }

  return (
    <FormularioFamilia
      inicial={inicial}
      rotuloSalvar="Salvar família"
      aoEnviar={cadastrar}
      acima={salva && (
        <Aviso titulo="Família cadastrada">
          A família de {salva.responsavelNome} entrou no cadastro com {salva.totais.totalPessoas}{' '}
          {salva.totais.totalPessoas === 1 ? 'pessoa' : 'pessoas'}. O formulário já está pronto para a
          próxima, na mesma comunidade.
        </Aviso>
      )}
    />
  );
}
