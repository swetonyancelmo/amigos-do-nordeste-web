# Cadastro de Famílias — Web

Frontend do sistema de cadastro das famílias atendidas pela **Associação Amigos
do Nordeste**, no Sertão do Moxotó (PE).

Next.js 15 (App Router) · React 19 · TypeScript

| | |
|---|---|
| Backend | `cadastro-familias-api` — *(colar a URL do repositório aqui)* |
| Protótipo (Figma) | https://www.figma.com/design/dEZbIRWGGdOQEsvAtsmFxQ |
| Especificação, requisitos e ADRs | no repositório da API, em `docs/` |
| Backend | Java 21 + Spring Boot 3.4 |

---

## Rodando

Precisa de **Node 22+** e **pnpm**. A API precisa estar de pé em paralelo.

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL aponta para a API
pnpm install
pnpm dev                       # http://localhost:3000
```

Sem a API rodando, a tela de login carrega mas nada funciona. Suba o outro
repositório primeiro — ele é Java/Spring Boot: `docker compose up -d db` e
`mvn spring-boot:run`.

---

## As telas

Estão desenhadas no Figma, com uma legenda em cima de cada uma explicando o que
ela resolve. Os frames são a referência de estrutura — **não** de espaçamento e
tipografia, que ainda vão mudar.

| Frame | Rota | Situação |
|---|---|---|
| 01 · Dashboard | `/painel` | a fazer |
| 02 · Lista de famílias | `/familias` | esqueleto |
| 03 · Cadastro da família | `/familias/nova` | a fazer |
| 04 · Necessidades da comunidade | `/relatorios` | esqueleto |
| 05 · Mobile | mesma rota, responsiva | a fazer |

---

## Como falar com a API

**Não escreva listas de opção à mão neste repositório.** Tamanho de roupa,
número de calçado, série escolar, tipo de fonte de renda, escoamento sanitário —
tudo isso vem de `GET /api/metadados`, já com o rótulo em português. Use o hook:

```tsx
const { metadados, carregando } = useMetadados();
// metadados.tamanhoRoupa -> [{ valor: 'PP', rotulo: 'PP' }, ...]
```

O motivo é concreto: os dois repositórios são independentes, então uma lista
copiada aqui e lá vira uma lista divergente em duas semanas — e o erro só
aparece quando a associação abre a tela. `src/tipos/dominio.ts` guarda **só as
declarações de tipo**, nunca valores.

A referência das rotas é o Swagger da API, em
`http://localhost:3333/swagger-ui.html`.

### Autenticação

`src/lib/api.ts` já implementa o combinado com o backend:

- o **access token vive em memória**, nunca em `localStorage` — token parado no
  disco do navegador é o que um XSS leva embora;
- o **refresh é um cookie `httpOnly`** que este código nem consegue ler; por
  isso todo `fetch` vai com `credentials: 'include'`;
- em `401`, o cliente tenta renovar uma vez e repete a chamada sozinho.

Se você mexer nisso, leia antes a ADR-0002 no repositório da API.

**Não existe tela de cadastro de usuário**, e não deve existir: o sistema tem
uma única usuária, criada por um comando no backend.

---

## Identidade visual

As cores saíram do logo da associação e estão em `src/app/globals.css` como
variáveis CSS. **Nenhum componente escreve hex direto** — sempre `var(--...)`.

A camada de componentes fica em `src/app/componentes.css` (campo, botão, aviso,
cartão, marca) com os componentes React em `src/componentes/`. Antes de
estilizar uma tela nova, veja a vitrine:

```bash
pnpm design-system     # gera e abre design-system/site/index.html
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

**Tem que imprimir.** No dia da entrega, no sítio, ninguém confere nome por nome
no celular. A lista por comunidade em papel fecha o ciclo — e custa um
`@media print` bem feito.

---

## Antes de começar as telas

Leia `docs/requisitos.md` no repositório da API. A elicitação com a associação
levantou **duas questões bloqueantes** que podem mudar o escopo — em especial a
Q-01, sobre quantas pessoas realmente vão usar o sistema. Construir a tela de
login e o fluxo de sessão assumindo uma usuária só é seguro; construir uma tela
de administração de usuários agora, não.

## O que falta

Marcado com `TODO(equipe frontend)` no código. Os maiores: as cinco telas, o
mapa com Leaflet mais a malha municipal do IBGE, e a folha de impressão.

O mapa mostra **um ponto por comunidade**, com o tamanho proporcional ao número
de famílias — nunca um pino por família. O porquê está na ADR-0005, no
repositório da API.
