'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Marca } from './Marca';
import { Botao } from './Botao';
import { guardarToken } from '@/lib/api';

/* Ícones desenhados à mão, no estilo do Sol.tsx — traço simples, sem trazer
   uma biblioteca inteira pra quatro ícones. Onde já existe rótulo ao lado,
   o ícone é decorativo (aria-hidden); os dois botões sem rótulo (abrir e
   fechar o menu) levam aria-label no <button>. */

function IconeCasa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconeRelatorio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-6" />
      <path d="M3 20h18" />
    </svg>
  );
}

function IconeMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

const ITENS = [
  { href: '/familias', rotulo: 'Famílias', Icone: IconeCasa },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: IconeRelatorio },
];

/**
 * Navegação, fixa em toda tela logada. A usuária é uma pessoa só (ver regra
 * 5 do sistema), então não há menu de conta — só as telas e Sair.
 *
 * No desktop é a barra lateral de sempre. Abaixo de 900px (ver
 * componentes.css) ela dorme fora da tela e vira um menu que desliza por
 * cima do conteúdo, aberto pelo botão de 3 traços na faixa do topo.
 */
export function Navegacao() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberta, setAberta] = useState(false);

  // Troca de tela fecha o menu — inclui o clique num link e o "Sair".
  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberta) return;

    document.body.style.overflow = 'hidden';
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberta(false);
    }
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberta]);

  function sair() {
    // TODO(equipe frontend): chamar POST /auth/sair para invalidar o cookie
    // de refresh no servidor, quando esse endpoint existir na API.
    guardarToken(null);
    router.push('/login');
  }

  return (
    <>
      <div className="navegacao__barra-mobile">
        <Marca largura={32} />
        <button
          type="button"
          className="navegacao__alternador"
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          aria-expanded={aberta}
        >
          <IconeMenu />
        </button>
      </div>

      {aberta && (
        <button
          type="button"
          className="navegacao__fundo"
          aria-label="Fechar menu"
          onClick={() => setAberta(false)}
        />
      )}

      <nav
        className={aberta ? 'navegacao navegacao--aberta' : 'navegacao'}
        aria-label="Navegação principal"
      >
        <div className="navegacao__topo">
          <div className="navegacao__marca">
            <Marca largura={104} />
          </div>
          <button
            type="button"
            className="navegacao__fechar"
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
          >
            <IconeFechar />
          </button>
        </div>

        <ul className="navegacao__links">
          {ITENS.map(({ href, rotulo, Icone }) => {
            const ativo = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="navegacao__link"
                  aria-current={ativo ? 'page' : undefined}
                >
                  <Icone />
                  {rotulo}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="navegacao__rodape">
          <Botao variante="secundario" largo onClick={sair}>
            Sair
          </Botao>
        </div>
      </nav>
    </>
  );
}
