import { Navegacao } from '@/componentes/Navegacao';

/**
 * Casco das telas logadas: navegação fixa à esquerda, conteúdo à direita.
 * Cada página monta seu próprio `Cabecalho` dentro do conteúdo, porque o
 * nome da tela e os botões mudam tela a tela — só a navegação é fixa.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Navegacao />
      <div className="app__conteudo">{children}</div>
    </div>
  );
}
