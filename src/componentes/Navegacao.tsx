'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Marca } from './Marca';
import { Botao } from './Botao';
import { api, guardarToken } from '@/lib/api';

/* Mesmo corte do @media em componentes.css — abaixo disso a barra lateral
   vira o menu deslizante. */
const TELA_ESTREITA = '(max-width: 899px)';

/* De quanto em quanto tempo a contagem de chamados é refeita com o painel
   parado na mesma tela — o app das agentes envia a qualquer hora. */
const INTERVALO_CHAMADOS = 60_000;

/**
 * Quantos pré-cadastros esperam revisão, para o contador no item Chamados.
 * Recontado ao trocar de tela (inclui voltar de um aprovar/devolver), a cada
 * minuto e quando a aba do navegador volta a ficar visível. Se a API falhar,
 * fica o último número: o contador é aviso, não pode derrubar a navegação.
 */
function useChamadosPendentes(pathname: string): number {
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    let ativo = true;
    function contar() {
      if (document.visibilityState !== 'visible') return;
      api.get<unknown[]>('/pre-cadastros?situacao=PENDENTE')
        .then((lista) => { if (ativo) setPendentes(lista.length); })
        .catch(() => {});
    }
    contar();
    const relogio = setInterval(contar, INTERVALO_CHAMADOS);
    document.addEventListener('visibilitychange', contar);
    return () => {
      ativo = false;
      clearInterval(relogio);
      document.removeEventListener('visibilitychange', contar);
    };
  }, [pathname]);

  return pendentes;
}

/** "99+" a partir de 100, pra caber no círculo. */
function textoDoContador(n: number): string {
  return n > 99 ? '99+' : String(n);
}

/* Ícones desenhados à mão, no estilo do Sol.tsx — traço simples, sem trazer
   uma biblioteca inteira pra cinco ícones. Onde já existe rótulo ao lado,
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

function IconeChamados() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d="M4 13h4l1.5 3h5L16 13h4" />
      <path d="M5.5 6.5 4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5l-1.5-6.5A1 1 0 0 0 17.5 6h-11a1 1 0 0 0-1 .5Z" />
    </svg>
  );
}

function IconeAgentes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <rect x="6.5" y="3" width="11" height="18" rx="2" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

function IconePainel() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
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

function IconePessoas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M16 14c2.4.2 3.9 1.8 4.5 5" />
    </svg>
  );
}

function IconeComunidade() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconePriorizacao() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d="M10 6h10" />
      <path d="M10 12h7" />
      <path d="M10 18h4" />
      <path d="M5 4v16" />
      <path d="m3 17 2 3 2-3" />
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

function IconePerfil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

const ITENS = [
  { href: '/inicio', rotulo: 'Início', Icone: IconePainel },
  { href: '/familias', rotulo: 'Famílias', Icone: IconeCasa },
  { href: '/priorizacao', rotulo: 'Priorização', Icone: IconePriorizacao },
  { href: '/chamados', rotulo: 'Chamados', Icone: IconeChamados, contaPendentes: true },
  { href: '/agentes', rotulo: 'Agentes', Icone: IconeAgentes },
  { href: '/pessoas', rotulo: 'Pessoas', Icone: IconePessoas },
  { href: '/comunidades', rotulo: 'Comunidades', Icone: IconeComunidade },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: IconeRelatorio },
];

/**
 * Navegação, fixa em toda tela logada. A usuária é uma pessoa só (ver regra
 * 5 do sistema) — por isso o rodapé não tem menu de conta com várias opções,
 * só o ícone de perfil (dados da própria usuária) e Sair.
 *
 * No desktop é a barra lateral de sempre. Abaixo de 900px (ver
 * componentes.css) ela dorme fora da tela e vira um menu que desliza por
 * cima do conteúdo, aberto pelo botão de 3 traços na faixa do topo.
 */
export function Navegacao() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  // Começa como desktop (é o que o servidor renderiza); acerta ao montar.
  const [estreita, setEstreita] = useState(false);
  const pendentes = useChamadosPendentes(pathname);
  const refAlternador = useRef<HTMLButtonElement>(null);
  const refMenu = useRef<HTMLElement>(null);
  // Só devolve o foco ao botão quando o menu fecha depois de ter aberto
  // (não na primeira montagem).
  const refFoiAberto = useRef(false);

  // Troca de tela fecha o menu — inclui o clique num link e o "Sair".
  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  // Acompanha a largura da tela. Se ela cresce com o menu aberto (tablet
  // girado), o fundo e o "X" somem pelo CSS e o menu viraria barra lateral
  // com o body ainda travado — por isso o menu fecha junto.
  useEffect(() => {
    const consulta = window.matchMedia(TELA_ESTREITA);
    function aoMudar() {
      setEstreita(consulta.matches);
      if (!consulta.matches) setAberta(false);
    }
    aoMudar();
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  // Menu aberto no celular funciona como diálogo (WCAG 2.4.3): o foco entra
  // nele, o resto da tela vira `inert` (sai do Tab e do leitor de tela), o
  // Tab dá a volta dentro do menu e, ao fechar, o foco volta ao botão.
  useEffect(() => {
    if (!aberta) {
      if (refFoiAberto.current) {
        refFoiAberto.current = false;
        // Fechou pelo X, pelo fundo, pelo Esc ou por um link: o menu ficou
        // `inert` e o foco ia parar no <body>.
        refAlternador.current?.focus();
      }
      return;
    }
    refFoiAberto.current = true;

    const menu = refMenu.current;
    const resto = Array.from(document.querySelectorAll<HTMLElement>('.navegacao__barra-mobile, .app__conteudo'));
    for (const el of resto) el.inert = true;
    menu?.querySelector<HTMLElement>('a[href], button')?.focus();

    document.body.style.overflow = 'hidden';
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAberta(false);
        return;
      }
      if (e.key !== 'Tab' || !menu) return;
      const focaveis = Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
        .filter((el) => el.offsetParent !== null);
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const atual = document.activeElement;
      if (e.shiftKey && (atual === primeiro || !menu.contains(atual))) {
        e.preventDefault();
        ultimo?.focus();
      } else if (!e.shiftKey && (atual === ultimo || !menu.contains(atual))) {
        e.preventDefault();
        primeiro?.focus();
      }
    }
    document.addEventListener('keydown', aoTeclar);

    return () => {
      for (const el of resto) el.inert = false;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberta]);

  async function sair() {
    // Sem isso o cookie de refresh continua válido e a próxima chamada à API
    // (um "voltar" do navegador, por exemplo) logaria a usuária de novo em
    // silêncio. Se a API ainda não tiver o endpoint, o erro é ignorado e a
    // sessão local é encerrada mesmo assim.
    await api.post('/auth/sair').catch(() => {});
    guardarToken(null);
    router.push('/login');
  }

  return (
    <>
      <div className="navegacao__barra-mobile">
        <Marca largura={32} />
        <button
          ref={refAlternador}
          type="button"
          className="navegacao__alternador"
          onClick={() => setAberta(true)}
          aria-controls="navegacao-principal"
          aria-label={pendentes > 0 ? `Abrir menu (${pendentes} chamados para revisar)` : 'Abrir menu'}
          aria-expanded={aberta}
        >
          <IconeMenu />
          {/* Com o menu fechado no celular, o contador do Chamados fica
              escondido — este ponto avisa que tem coisa esperando lá dentro. */}
          {pendentes > 0 && <span className="navegacao__ponto" aria-hidden="true" />}
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

      {/* Fechado no mobile, o menu só está fora da tela — `inert` tira ele do
          Tab e do leitor de tela, senão o foco ia parar em botão invisível. */}
      <nav
        ref={refMenu}
        id="navegacao-principal"
        className={aberta ? 'navegacao navegacao--aberta' : 'navegacao'}
        aria-label="Navegação principal"
        inert={estreita && !aberta}
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
          {ITENS.map(({ href, rotulo, Icone, contaPendentes }) => {
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
                  {contaPendentes && pendentes > 0 && (
                    <>
                      <span className="navegacao__contador" aria-hidden="true">
                        {textoDoContador(pendentes)}
                      </span>
                      <span className="so-leitor-de-tela">, {pendentes} para revisar</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="navegacao__rodape">
          <Link
            href="/perfil"
            className="navegacao__perfil"
            aria-label="Perfil"
            aria-current={pathname.startsWith('/perfil') ? 'page' : undefined}
          >
            <IconePerfil />
          </Link>
          <Botao variante="secundario" onClick={sair}>
            Sair
          </Botao>
        </div>
      </nav>
    </>
  );
}
