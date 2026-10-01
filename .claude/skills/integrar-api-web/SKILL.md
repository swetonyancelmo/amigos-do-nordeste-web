---
name: integrar-api-web
description: Liga uma tela do painel Next.js a uma rota da API Spring Boot do cadastro de famílias do jeito certo (cliente src/lib/api.ts com token em memória, tipos em src/tipos/dominio.ts espelhando os DTOs Java, listas via useMetadados, paginação PaginaResposta, erros ErroApi). Use quando a tarefa for "buscar da API", "salvar no backend", "trocar o mock pela API", consumir um endpoint, mexer em login, sessão, token ou renovação, tratar 401/400/404/409, ou quando a tela mostrar dado errado vindo do servidor.
---

# Integrar o web com a API

## Antes de escrever código

1. **Confira a rota no Swagger** (`http://localhost:3333/swagger-ui.html`) ou
   no código da API (`cadastro-familias-api/src/main/java/.../<modulo>/*Controller.java`
   e os records de DTO). Não adivinhe nomes de campo pelo Figma ou pelo guia:
   o Swagger é o contrato.
2. **A rota não existe ou falta um campo?** Não contorne no front. Abra ou
   peça a issue na API (CONTRIBUTING, regra 3). Rotas já sabidamente
   ausentes: `GET /api/relatorios/mapa` e qualquer `/api/usuario` de perfil.
   A troca de senha é `POST /api/auth/trocar-senha`.

## Cliente HTTP (`src/lib/api.ts`)

- Prefixa `/api`, envia `credentials: 'include'` e o `Authorization` com o
  token em memória. Em `401`, renova uma vez via cookie e repete a chamada.
- Hoje expõe só `get`, `post` e `patch`. A API usa **`PUT`** para editar e
  **`DELETE`** para remover pessoa, e não tem `PATCH`. Se precisar, acrescente
  seguindo o mesmo formato:
  ```ts
  put: <T>(caminho: string, corpo: unknown) =>
    chamar<T>(caminho, { method: 'PUT', body: JSON.stringify(corpo) }),
  delete: <T = void>(caminho: string) => chamar<T>(caminho, { method: 'DELETE' }),
  ```
- **Nunca** guarde o token em `localStorage`, `sessionStorage` ou cookie
  legível (ADR-0002). O refresh é cookie `httpOnly` que o JS nem vê.
- Erros chegam como `ErroApi` com `status` e a mensagem em português da API
  (campo `message` da `ErroResposta`). Mostre essa mensagem num
  `<Aviso tom="erro">`, porque ela foi escrita para a usuária.

## Tipos (`src/tipos/dominio.ts`)

- Só `type`/`interface`, **nunca valores ou rótulos**.
- Espelham os records e enums Java. Ao usar um tipo, confira se ele bate com o
  Java. Alguns estão desatualizados (`AbastecimentoAgua`, `TipoComunidade`).
  Ao corrigir, siga a skill
  `mudanca-de-contrato`, se a pasta que agrupa os repositórios estiver
  disponível.
- Página da API:
  ```ts
  export interface Pagina<T> {
    itens: T[]; pagina: number; porPagina: number; total: number; totalPaginas: number;
  }
  ```
  (a página começa em 0).
- IDs são UUID em string; datas `AAAA-MM-DD`; data e hora vêm em ISO com fuso.

## Listas fechadas

`const { metadados, carregando, erro } = useMetadados();`. As chaves são as de
`MetadadosResponse` (`tipoComunidade`, `sexo`, `abastecimentoAgua`,
`escoamentoSanitario`, `tratamentoAgua`, `tipoFonteRenda`, `faixaRenda`,
`serie`, `tamanhoRoupa`, `numeroCalcado`), cada uma com `{ valor, rotulo }`.
Envie `valor` para a API e mostre `rotulo`. `Parentesco` ainda não está lá:
peça na API em vez de fixar outra lista.

## Padrão de carregamento numa tela

```tsx
const [dados, setDados] = useState<Pagina<FamiliaResumo> | null>(null);
const [erro, setErro] = useState<string | null>(null);

useEffect(() => {
  let ativo = true;
  api.get<Pagina<FamiliaResumo>>(`/familias?busca=${encodeURIComponent(busca)}&pagina=${pagina}`)
    .then((r) => { if (ativo) setDados(r); })
    .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
  return () => { ativo = false; };
}, [busca, pagina]);
```

Monte query string com `URLSearchParams` quando houver vários filtros e omita
os vazios.

## Sessão

O token some ao recarregar a página (está em memória). A primeira chamada
recebe `401`, renova pelo cookie e segue. Se a renovação falha, redirecione
para `/login`. Ainda não há guarda de rota no grupo `(app)`; se a tarefa for
essa, faça a guarda tentando `POST /api/auth/renovar` ao montar o layout.

## Verificar

Com a API de pé e dados de teste (skill `rodar-api-local` da API), rode
`pnpm dev`, exercite o caminho feliz e um erro (400/404), e depois
`pnpm typecheck && pnpm lint`.
