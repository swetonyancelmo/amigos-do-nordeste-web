'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Usuario } from '@/tipos/dominio';

let cache: Usuario | null = null;
let pendente: Promise<Usuario> | null = null;

/**
 * Carrega os dados da conta (nome, e-mail) uma vez por sessão.
 *
 * Como o sistema tem uma usuária só (ver regra 5 do CLAUDE.md), isto não é
 * uma lista de usuárias — é só a conta de quem está logada, pra mostrar o
 * nome no lugar de um rótulo fixo no rodapé da navegação.
 */
export function useUsuario() {
  const [dados, setDados] = useState<Usuario | null>(cache);
  const [erro, setErro] = useState<Error | null>(null);

  useEffect(() => {
    if (cache) return;
    pendente ??= api.get<Usuario>('/usuario');
    pendente
      .then((u) => {
        cache = u;
        setDados(u);
      })
      .catch((e) => setErro(e instanceof Error ? e : new Error('Falha ao carregar os dados da conta.')));
  }, []);

  return { usuario: dados, carregando: !dados && !erro, erro };
}
