type Props = {
  /** Nome da tela, exibido à esquerda. */
  titulo: string;
  /** Botões de ação da tela, alinhados à direita. */
  children?: React.ReactNode;
};

/**
 * Cabeçalho de cada tela logada. A navegação fica fixa em `Navegacao`; isto
 * aqui é o que muda de tela para tela — nome e as ações daquela tela.
 */
export function Cabecalho({ titulo, children }: Props) {
  return (
    <header className="cabecalho-pagina">
      <h1 className="cabecalho-pagina__titulo">{titulo}</h1>
      {children && <div className="cabecalho-pagina__acoes">{children}</div>}
    </header>
  );
}
