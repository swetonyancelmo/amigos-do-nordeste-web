'use client';

import { Fragment, createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { Cabecalho } from './Cabecalho';

type EstadoCabecalho = {
  titulo: string;
  acoes: ReactNode;
  tituloNaPagina: boolean;
  subtitulo?: string;
};

const VAZIO: EstadoCabecalho = { titulo: '', acoes: null, tituloNaPagina: false };

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
  // `key` pelo título: cada tela ganha botões novos. Sem isso o React
  // reaproveita o mesmo <a> ("Voltar para a lista" vira "Nova família") e a
  // transição de 3s do fundo do .botao deixa texto branco em fundo claro
  // enquanto a cor muda (WCAG 1.4.3).
  return (
    <Cabecalho titulo={estado.titulo} tituloNaPagina={estado.tituloNaPagina} subtitulo={estado.subtitulo}>
      {estado.acoes && <Fragment key={estado.titulo}>{estado.acoes}</Fragment>}
    </Cabecalho>
  );
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
 *
 * `tituloNaPagina`: a tela desenha a própria <h1> no conteúdo, então o
 * título do cabeçalho não é <h1> (uma <h1> por tela).
 *
 * `subtitulo`: linha abaixo do título (o filtro de um relatório).
 */
export function useCabecalho(
  titulo: string,
  acoes?: ReactNode,
  { tituloNaPagina = false, subtitulo }: { tituloNaPagina?: boolean; subtitulo?: string } = {},
) {
  const definir = useContext(ContextoDefinir);

  useLayoutEffect(() => {
    definir({ titulo, acoes: acoes ?? null, tituloNaPagina, subtitulo });
  }, [definir, titulo, acoes, tituloNaPagina, subtitulo]);

  useLayoutEffect(() => () => definir(VAZIO), [definir]);
}
