---
name: preparar-pr-web
description: "Prepara um commit ou pull request no repositório web (Next.js) do cadastro de famílias: roda typecheck, lint e build, revisa o diff contra as regras do projeto (sem hex solto, sem array de opção, token fora do localStorage, sem dado real, vitrine do design system regenerada), escreve a mensagem em Conventional Commits em português e preenche o template de PR. Use quando o usuário pedir para commitar, abrir PR, 'subir', 'mandar pra revisão', revisar antes do merge, ou quando uma tarefa no web terminar."
---

# Preparar commit e PR — Web

## 1. Verificar

```bash
pnpm typecheck && pnpm lint && pnpm build
```

É o que o CI roda. Se falhar, mostre a saída e corrija antes de continuar.

## 2. Revisar o diff

```bash
git status --short && git diff main...HEAD --stat && git diff
```

Procure:

- **hex de cor** fora de `globals.css`: `git diff main...HEAD -- src | grep -nE '^\+.*#[0-9a-fA-F]{3,8}\b'`;
- **array de opções** escrito à mão (`<option value=` fixo, `const OPCOES = [`), em vez de `useMetadados()`;
- `localStorage`/`sessionStorage` com token;
- **mudança em `globals.css` ou `componentes.css`**: rode `pnpm design-system` e confira a vitrine. `design-system/site/` é ignorado pelo git; o que importa é o gerador (`design-system/gerar.mjs`) continuar funcionando e a vitrine publicada no Claude Design ser atualizada, se ela existir;
- **valores** em `src/tipos/dominio.ts`, que só aceita tipos;
- dado real de pessoa em mock, exemplo ou print;
- `.env.local` no diff (é ignorado, mas confira);
- chamada a rota que a API não tem.

Aponte o que encontrar ao usuário antes de commitar.

## 3. Commit

Branch a partir da `main`: `feat/`, `fix/`, `docs/`, `chore/` + kebab-case
(`feat/pagina-familias`). Só commite direto na `main` se o usuário pedir.

Mensagem em **Conventional Commits, em português**, escopo = tela ou área:

```
feat(familias): tabela de membros com linha em branco no fim
```

## 4. PR

Use `.github/pull_request_template.md`:

- **O que muda**, e **Tela do Figma / requisito** (frame e RF-xx).
- **Como testar**: começa por subir a API; liste os passos na tela.
- **Checklist**: marque só o que é verdade. "Testei no celular (ou no modo
  responsivo)" exige ter testado. Se precisou de algo que a API não tem, cite
  a issue aberta lá.

Crie com `gh pr create` só se o usuário pedir; caso contrário, entregue o
texto pronto. Merge com CI verde e uma aprovação.
