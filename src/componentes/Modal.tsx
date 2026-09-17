import { useEffect, useRef } from 'react';

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

  return (
    <div
      role="presentation"
      onClick={onFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31, 27, 24, 0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--superficie)',
          border: '1px solid var(--linha)',
          borderRadius: 'var(--raio-g)',
          boxShadow: 'var(--sombra)',
          padding: 24,
          color: 'var(--texto-forte)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <h2 id="modal-titulo" style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--fonte-marca)', color: 'var(--texto-forte)' }}>
            {titulo}
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
  );
}
