import { Navegacao } from '@/componentes/Navegacao';
import { ProvedorCabecalho, CabecalhoDaTela } from '@/componentes/ContextoCabecalho';

/**
 * Casco das telas logadas: navegação fixa à esquerda, cabeçalho + conteúdo
 * à direita. Diferente da navegação (sempre a mesma), o cabeçalho muda de
 * tela pra tela — cada página informa o título e os botões através do
 * `useCabecalho`; quem efetivamente desenha o cabeçalho é este layout.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorCabecalho>
      <div className="app">
        <Navegacao />
        <div className="app__conteudo">
          <CabecalhoDaTela />
          <div className="app__corpo">{children}</div>
        </div>
      </div>
    </ProvedorCabecalho>
  );
}
