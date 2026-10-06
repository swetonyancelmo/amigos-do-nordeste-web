'use client';

import { useEffect, useRef, useState } from 'react';

/** Quanto tempo o recado de sucesso fica na tela antes de sumir sozinho. */
const DURACAO_DO_RECADO = 4000;

/**
 * Recado passageiro de "deu certo".
 *
 * A tela de perfil tem dois formulários e cada um precisa do seu recado
 * (dados salvos, senha redefinida) — por isso o estado e o temporizador
 * ficam aqui, e não soltos dentro da tela.
 *
 * O temporizador vive num ref e é limpo ao desmontar: sem isso, sair da tela
 * com um recado aberto deixaria um setState rodando em componente desmontado.
 */
export function useRecado() {
  const [recado, setRecado] = useState('');
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function mostrar(texto: string) {
    setRecado(texto);

    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setRecado(''), DURACAO_DO_RECADO);
  }

  return { recado, mostrar };
}
