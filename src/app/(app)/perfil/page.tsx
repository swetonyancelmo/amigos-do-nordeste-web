'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';

/**
 * Perfil da usuária — os próprios dados de conta, não um cadastro de família.
 *
 * TODO(equipe frontend):
 *  - troca de senha: POST /api/auth/trocar-senha com { senhaAtual, senhaNova }
 *    (a nova com no mínimo 10 caracteres; senha atual errada responde 400);
 *  - a API NÃO tem rota de perfil (não existe /api/usuario nem "me"): para
 *    mostrar ou editar nome e e-mail, peça a rota no repositório da API antes.
 *    O nome e o e-mail de quem entrou chegam na resposta do login (`usuario`).
 */
export default function Perfil() {
  useCabecalho('Perfil');

  return <p>Atualização cadastral — a implementar.</p>;
}
