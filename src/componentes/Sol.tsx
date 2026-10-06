/**
 * O sol da marca, redesenhado como forma geométrica para uso decorativo —
 * fundo de tela, marca d'água, faixa. NÃO é a logo e não substitui a logo:
 * é só o motivo dos raios, sem o cacto e sem a abelha, para poder crescer,
 * sangrar pela borda e receber opacidade sem descaracterizar o arquivo
 * oficial (esse fica em `public/`, use o componente `Marca`).
 *
 * As cores vêm de --amarelo/--ambar/--laranja pelo gradiente do SVG, então
 * mudar o token muda o sol junto.
 */

const RAIOS = 12;
const RAIO_INTERNO = 32;
const RAIO_EXTERNO = 50;

/* Estrela de 12 pontas: alterna um vértice no raio externo (ponta do raio) e
   um no interno (vale entre dois raios). */
const pontos = Array.from({ length: RAIOS * 2 }, (_, i) => {
  const angulo = (Math.PI * i) / RAIOS - Math.PI / 2;
  const raio = i % 2 === 0 ? RAIO_EXTERNO : RAIO_INTERNO;
  return `${(50 + raio * Math.cos(angulo)).toFixed(2)},${(50 + raio * Math.sin(angulo)).toFixed(2)}`;
}).join(' ');

export function Sol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="sol-miolo" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="var(--amarelo)" />
          <stop offset="55%" stopColor="var(--ambar)" />
          <stop offset="100%" stopColor="var(--laranja)" />
        </radialGradient>
      </defs>
      <polygon points={pontos} fill="var(--laranja)" />
      <circle cx="50" cy="50" r="30" fill="url(#sol-miolo)" />
    </svg>
  );
}
