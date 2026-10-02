'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aoPerderSessao, garantirSessao } from '@/lib/api';

/**
 * Guarda das telas logadas. Ao montar, confere se há sessão (token em memória
 * ou cookie de renovação válido); sem ela, vai para o login sem mostrar a
 * tela. Depois fica ouvindo: se uma chamada recebe 401 que nem a renovação
 * resolve, também volta para o login.
 */
export function GuardaSessao({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    let ativo = true;
    garantirSessao().then((ok) => {
      if (!ativo) return;
      if (ok) setLiberado(true);
      else router.replace('/login');
    });
    aoPerderSessao(() => router.replace('/login'));
    return () => {
      ativo = false;
      aoPerderSessao(null);
    };
  }, [router]);

  if (!liberado) {
    return <p className="texto-apoio" role="status">Carregando…</p>;
  }
  return <>{children}</>;
}
