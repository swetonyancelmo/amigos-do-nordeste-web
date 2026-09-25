import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
};

export function Modal({ aberto, titulo, onFechar, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFechar();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    (
    <div
      role="presentation"
      onClick={onFechar}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(31, 27, 24, 0.28)',
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
        aria-labelledby="modal-titulo"
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
          <h2 id="modal-titulo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.4rem', fontFamily: 'var(--fonte-marca)', color: 'var(--texto-forte)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--laranja)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <circle cx="9" cy="8" r="3" />
              <path d="M3.5 20c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" />
              <path d="M17 11v6M14 14h6" />
            </svg>
            <span>{titulo}</span>
          </h2>

          <button
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
