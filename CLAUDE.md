# Contexto para assistentes de IA — Web

Frontend (painel administrativo) do cadastro de famílias da Associação Amigos do
Nordeste (Sertão do Moxotó, PE). Trabalho semestral de faculdade. O backend fica
em **outro repositório** (`cadastro-familias-api`: Java 21, Spring Boot 3.4,
Postgres). Existe ainda um app de campo (`cadastro-familias-app`) cujos envios
chegam aqui como pré-cadastros para aprovar.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Node 22 · **pnpm** ·
CSS puro (variáveis + `componentes.css` + CSS Modules) · Leaflet (instalado,
ainda sem uso). Sem biblioteca de UI e sem testes.

## Estrutura

```
src/app/
  layout.tsx, globals.css (tokens), componentes.css (classes de componente)
  page.tsx                 redireciona para /login
  login/                   tela de entrada (POST /api/auth/login)
  (app)/layout.tsx         casco logado: <Navegacao> + cabeçalho via ContextoCabecalho
  (app)/familias/          esqueleto (TODO)
  (app)/pessoas/           UI pronta, mas com DADOS MOCK locais, sem chamar a API
  (app)/relatorios/        esqueleto (TODO); botão Imprimir já existe
  (app)/perfil/            esqueleto (TODO)
src/componentes/           Botao, Campo, Aviso, Modal, Marca, Sol, Cabecalho,
                           ContextoCabecalho (useCabecalho), Navegacao,
                           pessoas/{ListaPessoas,ModalPessoa,PessoaForm},
                           fonte-renda/ModalFonteRenda
src/lib/api.ts             cliente HTTP (token em memória, renovação automática em 401)
src/lib/metadados.ts       useMetadados(): GET /api/metadados com cache por sessão
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
listar, `/{id}/aprovar`, `/{id}/devolver`), `/api/relatorios/necessidades`,
`/api/relatorios/situacao`, `/api/auth/trocar-senha`.

**Divergências conhecidas que precisam de correção:**

- `src/lib/api.ts` só expõe `get`, `post` e `patch`, mas a API usa **`PUT`**
  (famílias, pessoas, comunidades, municípios) e **`DELETE`** (pessoas) e não
  tem nenhum `PATCH`. Acrescente `put`/`delete` ao usar essas rotas.
- `src/tipos/dominio.ts` está desatualizado em relação aos enums Java: por
  exemplo, `AbastecimentoAgua` (API: `REDE_PUBLICA`, `POCO_NASCENTE_NO_DOMICILIO`,
  `CAPTACAO_DIRETA_RIO`, `POCO_COLETIVO`, `CHAFARIZ`…) e `TipoComunidade` (API
  tem `COMUNIDADE_QUILOMBOLA`, `VILA`, `OUTRO`). A fonte da verdade são os
  enums em `cadastro-familias-api/src/main/java/.../enums/` e o que
  `/api/metadados` devolve.
- O mock de `(app)/pessoas/page.tsx` usa `serie: 'FUNDAMENTAL_1'`, que não
  existe. A série válida vai de `PRE` e `ANO_1`…`ANO_9` até `ENSINO_MEDIO` e
  `NAO_SE_APLICA`.
- `PessoaForm.tsx` tem **parentesco** e **comunidade** escritos à mão.
  Parentesco é enum na API mas ainda não está em `/api/metadados` (peça lá).
  Comunidade deve vir de `GET /api/comunidades`, que já existe.
- Rotas citadas no código que **não existem** na API: `GET /api/relatorios/mapa`
  e `GET/PATCH /api/usuario` (perfil). Troca de senha é
  `POST /api/auth/trocar-senha`. O comentário do login fala em
  `pnpm usuario:criar`, mas isso é resquício da época NestJS.
- Não há proteção de rota: as páginas de `(app)` renderizam sem sessão, e o
  token some ao recarregar a página até a primeira chamada renovar pelo cookie.

As decisões de arquitetura (ADRs) e os requisitos estão no repositório da API,
em `docs/`. Leia antes de mudar autenticação, modelo de dados ou mapa.

## Comandos

```bash
cp .env.example .env.local     # API_URL=http://localhost:3333 (lida pelo Next, que repassa /api/*)
pnpm dev                       # http://localhost:3000 (a API precisa estar de pé)
pnpm typecheck && pnpm lint    # antes do PR; o CI também roda pnpm build
pnpm design-system             # regenera design-system/site/
```

## Skills

Em `.claude/skills/`: `nova-tela-web`, `integrar-api-web` e `preparar-pr-web`.
Para subir a API, use a skill `rodar-api-local` do repositório da API.
