---
name: nova-tela-web
description: Constrói ou evolui uma tela do painel Next.js do cadastro de famílias seguindo o padrão do projeto (rota no grupo (app), título e ações via useCabecalho, componentes e classes de componentes.css, cores só por token CSS, opções de useMetadados, CSS Module ao lado da página, teclado e impressão). Use sempre que a tarefa for implementar ou mudar uma página, formulário, modal, lista, tabela, relatório, dashboard ou mapa no web, "fazer a tela do Figma", "implementar o frame 02", ajustar layout mobile ou a folha de impressão.
---

# Nova tela no web

Leia antes: `CLAUDE.md` deste repositório e, se a tela é o cadastro de família,
`.claude/contextos/guia-cadastro-familia.md` (guia em capítulos com tipos,
reducer, seções e checklist de aceite). As telas estão no Figma
(https://www.figma.com/design/dEZbIRWGGdOQEsvAtsmFxQ): o frame é referência de
**estrutura**, não de espaçamento e tipografia.

## Onde a tela mora

- Tela logada: `src/app/(app)/<rota>/page.tsx`. O layout do grupo já desenha
  a navegação e o cabeçalho; a página não monta `<Cabecalho>` própria.
- Rota nova no menu: acrescente em `ITENS` de `src/componentes/Navegacao.tsx`.
- Estilo só desta tela: `src/app/(app)/<rota>/<rota>.module.css` (veja
  `pessoas/pessoas.module.css`).
- Componente reaproveitável por mais de uma tela: `src/componentes/` (em uma
  subpasta por domínio, como `pessoas/` e `fonte-renda/`).

## Esqueleto

```tsx
'use client';

import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Botao } from '@/componentes/Botao';
import estilos from './familias.module.css';

// Fora do componente: JSX estável, o cabeçalho não re-renderiza a cada tecla.
const ACOES = <Botao>Nova família</Botao>;

export default function Familias() {
  useCabecalho('Famílias', ACOES);
  return <section className={estilos.lista}>…</section>;
}
```

Se as ações dependem de estado, use `useMemo` para o JSX. Com JSX inline, o
cabeçalho re-renderiza a cada tecla.

## Peças disponíveis (use antes de criar outra)

| Precisa de | Use |
|---|---|
| botão | `<Botao variante="primario" \| "secundario" largo>`: um primário por tela |
| campo de texto | `<Campo rotulo ajuda erro …inputProps>`: já liga `id`, `aria-describedby` e o estado de inválido |
| recado ou erro | `<Aviso tom="explicacao" \| "erro" titulo>`: só onde a pessoa esbarra na regra; aviso permanente vira ruído |
| diálogo | `<Modal aberto titulo onFechar>`: Esc fecha e aceita modal dentro de modal |
| bloco com borda | classe `cartao` |
| texto secundário | classe `texto-apoio` |
| esconder na impressão | classe `nao-imprime` (botões já somem) |
| texto só para leitor de tela | classe `so-leitor-de-tela` |

Rode `pnpm design-system` e abra `design-system/site/index.html` para ver tudo
renderizado.

## Regras da tela

- **Cores, espaçamentos e fontes só por token** de `globals.css`:
  `var(--laranja)`, `var(--texto-medio)`, `var(--linha)`, `var(--e-4)`…
  Nenhum hex no componente nem no CSS Module. Precisa de cor nova? Crie o
  token em `globals.css` e rode `pnpm design-system` para conferir a vitrine.
- **`style` inline** só para ajuste de layout de uma tela; prefira o CSS Module.
- **Opções de `<select>`** vêm de `useMetadados()` (`metadados.tamanhoRoupa`
  etc.). Nunca escreva array de opção. Comunidade e município vêm de
  `GET /api/comunidades` e `GET /api/municipios`. Se a lista não existe na API,
  peça lá (skill `integrar-api-web`) em vez de fixar aqui.
- **Totais** (pessoas, até 12 anos, 60+) vêm calculados da API. Não some no
  front.
- **Velocidade de digitação é a funcionalidade**: no cadastro, a linha nova
  herda a comunidade, Enter salva e abre a próxima, e tudo funciona só com o
  teclado, com foco visível.
- **Busca de família é pelo nome da responsável**; lista com paginação
  simples (a API devolve `PaginaResposta`), sem scroll infinito.
- **Família não tem "excluir"**: tem "inativar" e "reativar".
- **Mapa**: um ponto por comunidade, nunca por família (Leaflet já está nas
  dependências). A API ainda não tem a rota do mapa.
- **Relatórios imprimem**: confira o `@media print` com a pré-visualização
  de impressão do navegador. A folha A4 também ativa o layout de celular
  (< 900px).
- **Responsivo**: teste em ~360px de largura.
- **Estados**: carregando, vazio, erro (`<Aviso tom="erro">` com a mensagem de
  `ErroApi`) e sucesso.
- **Dados de exemplo** são fictícios ("Família de Teste"). Nada de nome real
  em mock ou print.

## Verificar

```bash
pnpm typecheck && pnpm lint
pnpm build            # o CI roda; pega erro de Server/Client Component
pnpm dev              # com a API de pé (skill rodar-api-local no repositório da API)
```

Abra a tela no navegador, teste com o teclado, no modo responsivo e na
pré-visualização de impressão antes de dizer que está pronta. Se não foi
possível testar no navegador, diga isso.
