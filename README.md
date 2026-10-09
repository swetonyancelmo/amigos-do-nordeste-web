# Cadastro de Famílias — Web

Painel administrativo do sistema de cadastro das famílias atendidas pela
**Associação Amigos do Nordeste**, no Sertão do Moxotó (PE).

Next.js 15 (App Router) · React 19 · TypeScript · pnpm

| | |
|---|---|
| Backend | [`cadastro-familias-api`](https://github.com/swetonyancelmo/amigos-do-nordeste-api) — Java 21 + Spring Boot 3.4 |
| App de campo | [`cadastro-familias-app`](https://github.com/swetonyancelmo/amigos-do-nordeste-app) — os envios dele chegam aqui como pré-cadastros (Chamados) |
| Protótipo (Figma) | https://www.figma.com/design/dEZbIRWGGdOQEsvAtsmFxQ |
| Especificação, requisitos e ADRs | no repositório da API, em `docs/` |

---

## Rodando

Precisa de **Node 22+** e **pnpm**. A API precisa estar de pé em paralelo.

```bash
cp .env.example .env.local     # API_URL aponta para a API; o Next repassa /api/* para ela
pnpm install
pnpm dev                       # http://localhost:3000
```

Sem a API rodando, a tela de login carrega mas nada funciona. Suba o outro
repositório primeiro — ele é Java/Spring Boot: `docker compose up -d db` e
`mvn spring-boot:run`. A conta de acesso nasce do perfil `criar-usuario` da API
(não existe tela de cadastro de usuário nem "esqueci a senha").

`API_URL` é lida pelo servidor do Next (em `next.config.mjs`), não pelo
navegador: o painel chama `/api/...` na própria origem e o Next repassa para a
API. É isso que faz o cookie de renovação viajar mesmo com a API em outro
domínio. Em produção, `API_URL` é lida **no build**: trocou, gere de novo.

### Comandos

```bash
pnpm typecheck && pnpm lint    # o CI roda estes dois e mais pnpm build
pnpm test                      # Playwright (ver abaixo); o CI não roda
pnpm design-system             # regenera a vitrine em design-system/site/
```

---

## O que o painel faz

A usuária da associação entra com e-mail e senha e tem estas telas (menu
lateral; no celular, menu deslizante):

| Tela | Rota | O que faz |
|---|---|---|
| Login | `/login` | Entrada. Depois do login vai para `/inicio`. |
| Início | `/inicio` | Indicadores (famílias, pessoas, crianças até 12 anos, famílias sem banheiro), situação das famílias e **mapa das comunidades** com contorno do município, um ponto por comunidade e filtro por município. |
| Famílias | `/familias` | Lista paginada com busca pelo nome da responsável e filtros; ficha em modal, com **inativar/reativar** (família não se apaga); `/familias/nova` cadastra a família com os membros e a renda; `/familias/[id]/editar` edita. |
| Chamados | `/chamados` | Fila dos pré-cadastros enviados pelo app, em abas por situação (esperando, aprovados, devolvidos), com aviso de **possível duplicata** e contador no menu. Em `/chamados/[id]` a usuária vê o que a agente coletou, completa o cadastro (CPF, moradia, faixa de renda, fontes de renda, parentesco, série, roupa e calçado por pessoa) e **aprova** ou **devolve** com motivo. |
| Agentes | `/agentes` | Cadastra a agente e gera o **código de convite** do app; "Gerar novo código" desliga o celular atual. Não desativa nem renomeia agente (a API não tem a rota). |
| Pessoas | `/pessoas` | Lista com filtros; criar, editar, mover para outra família e remover pessoa. |
| Comunidades | `/comunidades` | Lista com busca e ficha em modal; `/comunidades/nova` cadastra com **mini-mapa** (marca a posição, sugere pelo nome via OpenStreetMap). Ainda não edita comunidade. |
| Relatórios | `/relatorios` | Necessidades de roupa e calçado por tamanho (até 12 anos ou todas as idades), situação das famílias e qualidade do cadastro, com filtro de município e comunidade. **Exporta Excel** (gerado pela API) e **PDF** (gerado no navegador); não há botão Imprimir, mas a folha de impressão (`@media print`) esconde filtros e menu para o Ctrl+P. |
| Perfil | `/perfil` | Nome e e-mail de quem entrou (só leitura) e troca de senha. |

O que o painel **não** faz: cadastrar outros usuários, campanhas, fotos e
vídeos, editar comunidade, excluir família (só inativa).

---

## Como falar com a API

**Não escreva listas de opção à mão neste repositório.** Tamanho de roupa,
número de calçado, série escolar, parentesco, tipo de fonte de renda,
escoamento sanitário — tudo isso vem de `GET /api/metadados`, já com o rótulo
em português. Use o hook:

```tsx
const { metadados, carregando } = useMetadados();
// metadados.tamanhoRoupa -> [{ valor: 'ADULTO_M', rotulo: 'Adulto M' }, ...]
```

O motivo é concreto: os repositórios são independentes, então uma lista
copiada aqui e lá vira uma lista divergente em duas semanas — e o erro só
aparece quando a associação abre a tela. `src/tipos/dominio.ts` guarda **só as
declarações de tipo**, nunca valores.

O cliente é `src/lib/api.ts` (`api.get`, `post`, `put`, `delete` e `baixar`
para arquivos). A referência das rotas é o Swagger da API, em
`http://localhost:3333/swagger-ui.html`.

### Autenticação

`src/lib/api.ts` implementa o combinado com o backend:

- o **access token vive em memória**, nunca em `localStorage` — token parado no
  disco do navegador é o que um XSS leva embora;
- o **refresh é um cookie `httpOnly`** que este código nem consegue ler; por
  isso todo `fetch` vai com `credentials: 'include'`;
- em `401`, o cliente tenta renovar uma vez e repete a chamada sozinho; se nem
  a renovação passa, a `GuardaSessao` manda para o login.

Se você mexer nisso, leia antes a ADR-0002 no repositório da API.

### Serviços externos

O navegador chama direto o **IBGE** (malha do município, para o contorno no
mapa) e o **Nominatim/OpenStreetMap** (sugestão de posição da comunidade, só ao
clicar em "Procurar no mapa"). Só nome de município/comunidade e UF viajam;
nenhum dado de família.

---

## Testes

`pnpm test` roda o Playwright em `e2e/`, subindo o Next na porta 3100. Nenhum
teste precisa da API: cada um intercepta `/api/*` e responde com dados
inventados (`e2e/api-falsa.ts`). Cobrem acessibilidade (axe, WCAG 2.1 AA),
teclado e foco de modais, validação e edição de família, abas de Chamados,
exportação em PDF e, em `e2e/mobile/`, fluxos no celular (Pixel 7 e iPhone 13).

Na primeira vez: `npx playwright install chromium webkit`.

---

## Identidade visual

As cores saíram do logo da associação e estão em `src/app/globals.css` como
variáveis CSS. **Nenhum componente escreve hex direto** — sempre `var(--...)`.

A camada de componentes fica em `src/app/componentes.css` (campo, botão, aviso,
cartão, marca) com os componentes React em `src/componentes/`. Antes de
estilizar uma tela nova, veja a vitrine:

```bash
pnpm design-system     # gera design-system/site/index.html
```

Ela é **gerada a partir do CSS de verdade**, então não tem como divergir do
código. O porquê e como publicar no Claude Design estão em
`design-system/README.md`.

| Token | Cor | Origem |
|---|---|---|
| `--laranja` | `#E54314` | raios do sol e tipografia do logo |
| `--ambar` | `#F49924` | gradiente do sol |
| `--verde` | `#119037` | cacto |
| `--amarelo` | `#FFC728` | abelha |
| `--pagina` | `#FAF6F1` | fundo |

---

## Duas coisas que não são detalhe de visual

**A tela de cadastro é o produto.** Como uma pessoa só digita tudo, a velocidade
de digitação é a funcionalidade principal, não um refinamento: os membros da
família entram em linha, cada linha nova herda a comunidade, e Enter salva e abre
a próxima. Se a tela ficar mais lenta que a planilha, o sistema não é adotado.
O guia dessa tela está em `.claude/contextos/guia-cadastro-familia.md`.

**Tem que imprimir.** No dia da entrega, no sítio, ninguém confere nome por nome
no celular. Os relatórios têm `@media print` e também exportam PDF e Excel.

---

## Antes de mudar o escopo

Leia `docs/requisitos.md` no repositório da API. A elicitação com a associação
levantou **questões bloqueantes** que podem mudar o escopo — em especial a Q-01,
sobre quantas pessoas realmente vão usar o sistema (hoje é uma só), e a Q-02,
sobre fotos e vídeos. Construir uma tela de administração de usuários agora não
é seguro.

O mapa mostra **um ponto por comunidade**, com o tamanho proporcional ao número
de famílias — nunca um pino por família. O porquê está na ADR-0005, no
repositório da API.
