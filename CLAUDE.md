# Contexto para assistentes de IA — Web

Frontend (painel administrativo) do cadastro de famílias da Associação Amigos do
Nordeste (Sertão do Moxotó, PE). Trabalho semestral de faculdade. O backend fica
em **outro repositório** (`cadastro-familias-api`: Java 21, Spring Boot 3.4,
Postgres). Existe ainda um app de campo (`cadastro-familias-app`) cujos envios
chegam aqui como pré-cadastros para aprovar.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Node 22 · **pnpm** ·
CSS puro (variáveis + `componentes.css` + CSS Modules) · Leaflet + react-leaflet
(mini-mapa da comunidade; carregar com `next/dynamic` e `ssr: false`). Sem biblioteca de UI.
@react-pdf/renderer só para o PDF do relatório, carregado sob demanda no clique.
Testes: só de acessibilidade, com Playwright + axe em `e2e/` (API falsa, sem dado real).

## Estrutura

```
src/app/
  layout.tsx, globals.css (tokens), componentes.css (classes de componente)
  page.tsx                 redireciona para /login
  login/                   tela de entrada (POST /api/auth/login)
  (app)/layout.tsx         casco logado: <Navegacao> + cabeçalho via ContextoCabecalho
  (app)/chamados/          fila de pré-cadastros do app; [id] revisa, aprova ou devolve
  (app)/agentes/           agentes do app: cadastrar e gerar código de convite (novo código desliga o celular atual)
  (app)/familias/          lista com busca, filtros e ficha em modal (API), que inativa/reativa; nova/ cadastra (POST /api/familias);
                           [id]/editar edita (PUT /api/familias/{id}); o formulário é src/componentes/familia/
  (app)/pessoas/           lista com filtros e modal criar/editar/remover (API)
  (app)/comunidades/       lista com busca e ficha em modal (GET /api/comunidades); nova/ cadastra com mini-mapa; ainda sem edição
  (app)/relatorios/        necessidades (roupa/calçado por tamanho), situação das famílias e qualidade do cadastro;
                           exporta .xlsx (API) e PDF (gerado no navegador, src/componentes/relatorios/)
  (app)/perfil/            nome e e-mail do login (só leitura) e troca de senha (POST /api/auth/trocar-senha)
src/componentes/           Botao, Campo, Selecao, Aviso, Modal, Paginacao, Marca, Sol, Cabecalho,
                           ContextoCabecalho (useCabecalho), Navegacao, GuardaSessao,
                           pessoas/{ListaPessoas,ModalPessoa,PessoaForm},
                           fonte-renda/ModalFonteRenda,
                           familia/{FormularioFamilia,formularioFamilia} (cadastro e edição),
                           comunidade/MiniMapa (contorno IBGE, pino, satélite, "Procurar no mapa"),
                           relatorios/{PdfNecessidades,gerarPdfNecessidades} (@react-pdf, carregado só no clique)
src/lib/municipios.ts      IBGE: UFs, municípios, malha (contorno); garantirMunicipio
src/lib/nominatim.ts       sugestão de posição pelo nome (1 busca/s, só no clique, com cache)
src/lib/api.ts             cliente HTTP (token em memória, renovação automática em 401; api.baixar para arquivo)
src/lib/arquivo.ts         salvarArquivo(blob, nome): download sem abrir aba
src/lib/metadados.ts       useMetadados(): GET /api/metadados com cache por sessão
src/lib/datas.ts           data e data/hora para a tela (fuso America/Recife)
src/lib/recado.ts          recado em memória para a próxima tela ("Família atualizada")
src/lib/useRecado.ts       recado passageiro de sucesso na mesma tela (some em 4 s)
src/tipos/dominio.ts       só tipos, espelhando os enums/DTOs do backend
design-system/             gerador da vitrine (pnpm design-system)
.claude/contextos/guia-cadastro-familia.md   guia longo da tela de cadastro de família
```

Cada página do grupo `(app)` define título e ações com `useCabecalho(titulo, acoes)`;
as ações ficam numa constante fora do componente para o JSX ser estável.

## Regras

1. **Português em tudo**: componentes, variáveis, commits, comentários.
2. **Nunca escreva arrays de opção.** Tamanho de roupa, calçado, série, fonte de
   renda, saneamento etc. vêm de `GET /api/metadados` via `useMetadados()`.
   `src/tipos/dominio.ts` tem só declarações de tipo.
3. **Cores só por variável CSS** do `globals.css` (`--laranja`, `--ambar`,
   `--verde`, `--pagina`…). Nada de hex direto em componente. Monte telas com as
   classes de `componentes.css` e os componentes de `src/componentes/`. Mexeu
   em token ou classe? Rode `pnpm design-system` no mesmo commit.
4. **Access token em memória**, refresh em cookie `httpOnly`. Nunca guarde token
   em `localStorage`. Todo `fetch` vai com `credentials: 'include'`, e isso já
   está em `src/lib/api.ts`.
   O navegador chama sempre `/api/...` na própria origem; o `rewrites` do
   `next.config.mjs` repassa para a API (`API_URL`). Não chame a API por URL
   absoluta: o cookie de renovação deixa de viajar quando ela está em outro
   domínio (ADR-0004).
5. **Não existe tela de cadastro de usuário** nem "esqueci a senha". O painel
   tem uma usuária só; a conta nasce do perfil `criar-usuario` da API.
6. **Mapa é por comunidade**, nunca por família (ADR-0005).
7. A tela de cadastro precisa ser rápida de digitar: linha nova herda a
   comunidade, Enter salva e abre a próxima. Isso é requisito, não refinamento.
8. Relatórios precisam imprimir bem (`@media print`).
9. **Família não se exclui, se inativa** (`POST /api/familias/{id}/inativar`).
   A lista só mostra inativas com `incluirInativas=true`.
10. Nada de dado real de família em exemplo, mock ou print.
11. Precisa de campo ou rota que a API não tem? Abra issue lá antes de
    contornar aqui.

## Contrato com a API (confira no Swagger antes de usar)

Swagger: `http://localhost:3333/swagger-ui.html`. Rotas que interessam ao painel:
`/api/familias` (lista paginada com `busca`, `comunidadeId`, `municipioId`,
`semBanheiro`, `incluirInativas`, `pagina`, `porPagina`; ficha em `/{id}` com
`totais` calculados), `/api/pessoas`, `/api/familias/{id}/pessoas`,
`/api/comunidades`, `/api/municipios`, `/api/pre-cadastros` (fila de chamados:
listar, ficha em `/{id}`, `/{id}/aprovar`, `/{id}/devolver`), `/api/relatorios/necessidades`,
`/api/relatorios/situacao`, `/api/auth/trocar-senha`, `/api/agentes` (criar,
listar, `/{id}/novo-convite`; não há rota para desativar nem renomear).

**O que ainda falta ou diverge (02/10/2026):**

- `/pessoas` está ligada à API. Pessoa nasce dentro de uma família (busca por
  responsável em `GET /api/familias?busca=`); a comunidade vem da família. Fonte
  de renda saiu do modal de pessoa: a API só aceita renda no POST/PUT da família,
  e `ModalFonteRenda` fica para a tela de família.
- `GET /api/relatorios/mapa?municipioId=` devolve `{ municipio | null, pontos[] }`
  (um ponto por comunidade: `comunidadeId`, `nome`, `latitude`, `longitude`,
  `familias`); o Início usa o `municipio.codigoIbge` dela para o contorno. Não há
  rota de perfil (`/api/usuario`). Troca de senha é `POST /api/auth/trocar-senha`.
- `src/tipos/dominio.ts` foi alinhado com os enums e DTOs Java nesta data. Ao
  mudar algo na API, ajuste aqui no mesmo PR (skill `mudanca-de-contrato`).

As decisões de arquitetura (ADRs) e os requisitos estão no repositório da API,
em `docs/`. Leia antes de mudar autenticação, modelo de dados ou mapa.

## Comandos

```bash
cp .env.example .env.local     # API_URL=http://localhost:3333 (lida pelo Next, que repassa /api/*)
pnpm dev                       # http://localhost:3000 (a API precisa estar de pé)
pnpm typecheck && pnpm lint    # antes do PR; o CI também roda pnpm build
pnpm design-system             # regenera design-system/site/
pnpm test                      # Playwright + axe (sobe o Next na 3100; não precisa da API)
                               # 1ª vez: npx playwright install chromium
```

## Skills

Em `.claude/skills/`: `nova-tela-web`, `integrar-api-web` e `preparar-pr-web`.
Para subir a API, use a skill `rodar-api-local` do repositório da API.
