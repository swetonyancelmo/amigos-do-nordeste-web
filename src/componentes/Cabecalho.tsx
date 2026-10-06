type Props = {
  /** Nome da tela, exibido à esquerda. */
  titulo: string;
  /** Botões de ação da tela, alinhados à direita. */
  children?: React.ReactNode;
  /**
   * A tela já tem a própria <h1> no conteúdo (ex.: detalhe do chamado). O
   * título aqui continua igual na tela, mas deixa de ser cabeçalho, para a
   * página não ter duas <h1> (WCAG 1.3.1).
   */
  tituloNaPagina?: boolean;
  /** Linha curta abaixo do título: o recorte que a tela mostra (relatórios). */
  subtitulo?: string;
};

/**
 * Cabeçalho de cada tela logada. A navegação fica fixa em `Navegacao`; isto
 * aqui é o que muda de tela para tela — nome e as ações daquela tela.
 */
export function Cabecalho({ titulo, children, tituloNaPagina = false, subtitulo }: Props) {
  const Titulo = tituloNaPagina ? 'p' : 'h1';

  return (
    <header className="cabecalho-pagina">
      <div>
        <Titulo className="cabecalho-pagina__titulo">{titulo}</Titulo>
        {subtitulo && <p className="cabecalho-pagina__subtitulo">{subtitulo}</p>}
      </div>
      {children && <div className="cabecalho-pagina__acoes">{children}</div>}
    </header>
  );
}
