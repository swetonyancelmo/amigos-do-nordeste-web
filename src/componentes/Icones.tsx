/**
 * Ícones do sistema.
 *
 * Traço simples, desenhados à mão — o mesmo da navegação (que ainda tem os
 * dela em Navegacao.tsx). Quem precisar de um ícone novo desenha neste
 * arquivo, no mesmo traço dos outros, em vez de criar outra família.
 *
 * Nenhum ícone traz cor própria: todos pintam com `currentColor`, então quem
 * usa define a cor pelo CSS (`color`) — hoje é o marrom de `--texto-medio`.
 * Todos são decorativos (aria-hidden): o significado vem do texto ao lado ou
 * do aria-label do botão que os contém.
 */
type PropsIcone = {
  /** Lado do quadrado, em px. O viewBox é sempre 24. */
  tamanho?: number;
};

type PropsSvg = PropsIcone & { children: React.ReactNode };

function Svg({ tamanho = 18, children }: PropsSvg) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Silhueta de pessoa — a mesma da navegação, do rodapé ao avatar. */
export function IconePerfil({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </Svg>
  );
}

export function IconeChave({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.6 12.4 19 4" />
      <path d="M15.5 7.5 18 10" />
    </Svg>
  );
}

export function IconeConfirmar({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Svg>
  );
}
