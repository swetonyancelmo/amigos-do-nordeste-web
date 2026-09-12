'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { Cabecalho } from './Cabecalho';

type EstadoCabecalho = {
  titulo: string;
  acoes: ReactNode;
};

const VAZIO: EstadoCabecalho = { titulo: '', acoes: null };

const ContextoDefinir = createContext<(estado: EstadoCabecalho) => void>(() => {});
const ContextoEstado = createContext<EstadoCabecalho>(VAZIO);

/**
 * Guarda o título e os botões do cabeçalho da tela atual. Fica uma vez só no
 * layout do grupo (app) — cada página avisa o que quer mostrar através do
 * `useCabecalho`, em vez de montar o próprio `<Cabecalho>`.
 */
export function ProvedorCabecalho({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoCabecalho>(VAZIO);
  const definir = useCallback((novo: EstadoCabecalho) => setEstado(novo), []);

  return (
    <ContextoDefinir.Provider value={definir}>
      <ContextoEstado.Provider value={estado}>{children}</ContextoEstado.Provider>
    </ContextoDefinir.Provider>
  );
}

/** Renderiza o cabeçalho da tela atual. Vive uma vez só, dentro do layout. */
export function CabecalhoDaTela() {
  const estado = useContext(ContextoEstado);
  return <Cabecalho titulo={estado.titulo}>{estado.acoes}</Cabecalho>;
}

/**
 * Cada página chama isso pra dizer o nome da tela e os botões de ação dela.
 * Ex.: useCabecalho('Famílias', <Botao>Nova família</Botao>);
 *
 * useLayoutEffect (não useEffect) pra trocar o título antes da tela pintar —
 * assim quem navega não vê o título da página anterior por um instante.
 *
 * Ao desmontar, o cabeçalho volta a vazio: uma rota que não chama o hook
 * (404, tela de erro) não pode ficar com o título e os botões da anterior.
 *
 * `acoes` entra nas dependências do efeito. JSX criado inline é um objeto
 * novo a cada render, então numa tela que re-renderiza a cada tecla (o
 * cadastro) o cabeçalho re-renderizaria junto — nesse caso declare o JSX
 * fora do componente ou envolva em useMemo.
 */
export function useCabecalho(titulo: string, acoes?: ReactNode) {
  const definir = useContext(ContextoDefinir);

  useLayoutEffect(() => {
    definir({ titulo, acoes: acoes ?? null });
  }, [definir, titulo, acoes]);

  useLayoutEffect(() => () => definir(VAZIO), [definir]);
}
