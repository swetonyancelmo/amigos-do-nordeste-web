# Como contribuir — Web

## Antes do PR

```bash
pnpm typecheck && pnpm lint
```

## Fluxo

1. Branch a partir da `main`: `feat/`, `fix/`, `docs/`, `chore/` + descrição em
   kebab-case.
2. Commits em Conventional Commits, em português:
   `feat(familias): tabela de membros com linha em branco no fim`
3. **Precisou de um campo ou de uma rota que a API não tem? Abra issue lá antes
   de improvisar aqui.** Com repositórios separados, gambiarra no frontend para
   contornar backend é a coisa mais difícil de desfazer depois.
4. Merge com CI verde e uma aprovação.

## Regras de código

- **Monte a tela com as classes de `src/app/componentes.css`** — campo, botão,
  aviso, cartão, marca. `style` inline só para layout de uma tela só, e mesmo
  assim prefira um CSS Module ao lado da página. Foi `style` inline espalhado
  que deixou a primeira tela de login sem cara nenhuma.
- Mexeu em token ou em classe de componente? Rode `pnpm design-system` no
  mesmo commit — a vitrine é gerada do CSS, e só fica certa se for regerada.
  O porquê está em `design-system/README.md`.
- Cores só por `var(--token)` do `globals.css`. Nada de hex solto no componente.
- Opções de `<select>` vêm de `useMetadados()`, nunca de array escrito à mão.
- `src/tipos/dominio.ts` guarda apenas tipos — sem valores, sem rótulos.
- Português nos nomes, nos commits e nos comentários.
- Foco visível em tudo que é interativo: boa parte do cadastro é feita no
  teclado, e é isso que torna a digitação rápida.

## Dados sensíveis

Nada de print de tela com dado real de família em issue, PR ou no chat do grupo.
O cadastro tem dados de menores, renda e condição de moradia.
