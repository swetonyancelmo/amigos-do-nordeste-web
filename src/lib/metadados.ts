'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Metadados } from '@/tipos/dominio';

let cache: Metadados | null = null;
let pendente: Promise<Metadados> | null = null;

/**
 * Carrega as listas fechadas da API uma vez por sessão.
 *
 * É daqui que saem as opções de tamanho de roupa, número de calçado, série,
 * fonte de renda e escoamento sanitário. Se você está prestes a escrever um
 * array de opções à mão numa tela, use isto no lugar — assim, quando a
 * associação pedir uma opção nova, ela aparece sem alterar o frontend.
 */
export function useMetadados() {
  const [dados, setDados] = useState<Metadados | null>(cache);
  const [erro, setErro] = useState<Error | null>(null);

  useEffect(() => {
    if (cache) return;
    pendente ??= api.get<Metadados>('/metadados');
    pendente
      .then((m) => {
        cache = m;
        setDados(m);
      })
      .catch((e) => setErro(e instanceof Error ? e : new Error('Falha ao carregar as listas.')));
  }, []);

  return { metadados: dados, carregando: !dados && !erro, erro };
}
