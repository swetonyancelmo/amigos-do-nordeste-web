import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
};

// Modais podem abrir um dentro do outro (ex.: fonte de renda dentro de
// pessoa). A pilha garante que o scroll da página só volta quando o último
// modal fecha, e que só o modal de cima responde ao Tab e ao Esc.
const pilha: HTMLElement[] = [];

const FOCAVEIS = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Janela por cima da tela. O foco é responsabilidade daqui (WCAG 2.4.3):
 * ao abrir, entra no modal (no campo com `autoFocus`, se houver; senão no
 * botão de fechar); o Tab fica preso dentro dele; o resto da página vira
 * `inert`; ao fechar, o foco volta para quem abriu.
 */
export function Modal({ aberto, titulo, onFechar, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const refFundo = useRef<HTMLDivElement | null>(null);
  const refFechar = useRef<HTMLButtonElement | null>(null);
  const idTitulo = useId();
  // Em ref para o efeito não rodar de novo quando a tela recria o callback
  // (rodar de novo puxaria o foco de volta para o botão de fechar).
  const refOnFechar = useRef(onFechar);
  refOnFechar.current = onFechar;

  useEffect(() => {
    const painel = ref.current;
    const fundo = refFundo.current;
    if (!aberto || !painel || !fundo) return;

    const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Tudo fora deste modal sai do alcance do Tab e do leitor de tela.
    const travados: HTMLElement[] = [];
    for (const irmao of Array.from(document.body.children)) {
      if (irmao !== fundo && irmao instanceof HTMLElement && !irmao.inert) {
        irmao.inert = true;
        travados.push(irmao);
      }
    }

    if (!painel.contains(document.activeElement)) refFechar.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (pilha[pilha.length - 1] !== painel) return;
      if (event.key === 'Escape') {
        refOnFechar.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focaveis = Array.from(painel.querySelectorAll<HTMLElement>(FOCAVEIS))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focaveis.length === 0) {
        event.preventDefault();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const atual = document.activeElement;
      if (event.shiftKey && (atual === primeiro || !painel.contains(atual))) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (atual === ultimo || !painel.contains(atual))) {
        event.preventDefault();
        primeiro.focus();
      }
    };

    pilha.push(painel);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      pilha.splice(pilha.indexOf(painel), 1);
      if (pilha.length === 0) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      for (const el of travados) el.inert = false;
      if (origem?.isConnected) origem.focus();
    };
  }, [aberto]);

  if (!aberto) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    (
    <div
      ref={refFundo}
      role="presentation"
      onClick={onFechar}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--sobreposicao)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <div
        ref={ref}
        className="modal__painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(760px, calc(100vw - 40px))',
          maxWidth: 'calc(100vw - 40px)',
          minWidth: 0,
          boxSizing: 'border-box',
          margin: 'auto',
          maxHeight: '90dvh',
          overflow: 'auto',
          background: 'var(--superficie)',
          border: '1px solid var(--linha)',
          boxShadow: 'var(--sombra)',
          padding: 24,
          color: 'var(--texto-forte)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <h2 id={idTitulo} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.4rem', fontFamily: 'var(--fonte-marca)', color: 'var(--texto-forte)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--laranja)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <circle cx="9" cy="8" r="3" />
              <path d="M3.5 20c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" />
              <path d="M17 11v6M14 14h6" />
            </svg>
            <span>{titulo}</span>
          </h2>

          <button
            ref={refFechar}
            type="button"
            aria-label="Fechar modal"
            onClick={onFechar}
            style={{
              border: '1px solid var(--linha-forte)',
              background: 'var(--superficie)',
              color: 'var(--texto-forte)',
              borderRadius: 'var(--raio)',
              width: 34,
              height: 34,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
      </div>
    ),
    document.body,
  );
}
