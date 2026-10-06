/**
 * Ícones do sistema.
 *
 * Traço simples, desenhados à mão — é o que a navegação já usava. Ficam
 * todos aqui para não existirem duas famílias de ícone na mesma tela: quem
 * precisar de um ícone novo desenha neste arquivo, no mesmo traço dos outros.
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

export function IconeCasa({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </Svg>
  );
}

export function IconeRelatorio({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-6" />
      <path d="M3 20h18" />
    </Svg>
  );
}

export function IconeMenu({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconeFechar({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Svg>
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

export function IconeCamera({ tamanho }: PropsIcone) {
  return (
    <Svg tamanho={tamanho}>
      <path d="M3 9a2 2 0 0 1 2-2h2l1.5-2h7L17 7h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
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
