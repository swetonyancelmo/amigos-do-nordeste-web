# Contexto para assistentes de IA — Web

Frontend do cadastro de famílias da Associação Amigos do Nordeste (Sertão do
Moxotó, PE). Trabalho semestral de faculdade. O backend fica em **outro
repositório** (`cadastro-familias-api`), Java 21 + Spring Boot 3.4 + Postgres.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Node 22 · pnpm

## Regras

1. **Português em tudo**: componentes, variáveis, commits, comentários.
2. **Nunca escreva arrays de opção.** Tamanho de roupa, série, fonte de renda e
   escoamento sanitário vêm de `GET /api/metadados` via `useMetadados()`.
   `src/tipos/dominio.ts` tem só declarações de tipo.
3. **Cores só por variável CSS** do `globals.css` (`--laranja`, `--ambar`,
   `--verde`, `--pagina`…). Nada de hex direto em componente.
4. **Access token em memória**, refresh em cookie `httpOnly`. Nunca guarde token
   em `localStorage`.
5. **Não existe tela de cadastro de usuário.** O sistema tem uma usuária só.
6. **Mapa é por comunidade**, nunca por família — o ponto vem de
   `GET /api/relatorios/mapa`.
7. A tela de cadastro precisa ser rápida de digitar: linha nova herda a
   comunidade, Enter salva e abre a próxima. Isso é requisito, não refinamento.
8. Relatórios precisam imprimir bem (`@media print`).
9. Nada de dado real de família em exemplo, mock ou print.

As decisões de arquitetura (ADRs) estão no repositório da API, em
`docs/decisoes/`. Leia antes de mudar autenticação, modelo de dados ou mapa.

## Comandos

```bash
pnpm dev
pnpm typecheck && pnpm lint
```
