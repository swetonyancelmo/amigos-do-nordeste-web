import type { CSSProperties } from 'react';
import styles from './Loading.module.css';

const RAIOS = [
  'M 88.29 41.15 L 100.00 8.00 L 111.71 41.15 Z',
  'M 111.71 41.15 L 135.21 15.00 L 133.33 50.11 Z',
  'M 133.33 50.11 L 165.05 34.95 L 149.89 66.67 Z',
  'M 149.89 66.67 L 185.00 64.79 L 158.85 88.29 Z',
  'M 158.85 88.29 L 192.00 100.00 L 158.85 111.71 Z',
  'M 158.85 111.71 L 185.00 135.21 L 149.89 133.33 Z',
  'M 149.89 133.33 L 165.05 165.05 L 133.33 149.89 Z',
  'M 133.33 149.89 L 135.21 185.00 L 111.71 158.85 Z',
  'M 111.71 158.85 L 100.00 192.00 L 88.29 158.85 Z',
  'M 88.29 158.85 L 64.79 185.00 L 66.67 149.89 Z',
  'M 66.67 149.89 L 34.95 165.05 L 50.11 133.33 Z',
  'M 50.11 133.33 L 15.00 135.21 L 41.15 111.71 Z',
  'M 41.15 111.71 L 8.00 100.00 L 41.15 88.29 Z',
  'M 41.15 88.29 L 15.00 64.79 L 50.11 66.67 Z',
  'M 50.11 66.67 L 34.95 34.95 L 66.67 50.11 Z',
  'M 66.67 50.11 L 64.79 15.00 L 88.29 41.15 Z',
];

type Props = {
  mensagem?: string;
  tamanho?: 'compacto' | 'normal' | 'grande';
  telaCheia?: boolean;
};

type EstiloRaio = CSSProperties & { '--indice-raio': number };

export function Loading({
  mensagem = 'Carregando…',
  tamanho = 'normal',
  telaCheia = false,
}: Props) {
  const classes = [
    styles.loading,
    styles[tamanho],
    telaCheia ? styles.telaCheia : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite" aria-busy="true">
      <svg className={styles.sol} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        {RAIOS.map((raio, indice) => (
          <path
            key={raio}
            className={styles.raio}
            style={{ '--indice-raio': indice } as EstiloRaio}
            d={raio}
            fill="var(--laranja)"
          />
        ))}
        <g
          className={styles.cacto}
          fill="none"
          stroke="var(--verde)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 100 142 L 100 76" />
          <path d="M 100 112 Q 124 112 124 92 L 124 64" />
          <path d="M 100 122 Q 80 122 80 106 L 80 86" />
        </g>
      </svg>
      <span className={styles.mensagem}>{mensagem}</span>
    </div>
  );
}
