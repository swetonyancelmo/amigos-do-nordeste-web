'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';

/**
 * Perfil da usuária — os próprios dados de conta, não um cadastro de família.
 *
 * TODO(equipe frontend):
 *  - GET /api/usuario para carregar nome e e-mail atuais;
 *  - PATCH /api/usuario para salvar a "Atualização cadastral";
 *  - troca de senha exige a senha atual, em campo separado.
 */
export default function Perfil() {
  useCabecalho('Perfil');

  return <p>Atualização cadastral — a implementar.</p>;
}
