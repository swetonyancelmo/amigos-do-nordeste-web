# Vitrine do padrão de design

Página que mostra os tokens e os componentes do sistema, para quem vai fazer
uma tela nova saber o que reusar.

```bash
pnpm design-system      # gera design-system/site/
```

Depois é só abrir `design-system/site/index.html` no navegador. Não precisa de
servidor: a página é um arquivo só, com a fonte e o logo embutidos.

## Por que ela é gerada e não escrita

O gerador lê `src/app/globals.css`, `src/app/componentes.css` e
`src/app/login/login.module.css`, e injeta esse CSS **de verdade** dentro de
iframes. Cada demonstração é o componente real rodando, e os hex das amostras
de cor são extraídos do `:root` do `globals.css`.

Uma biblioteca de componentes documentada à mão em Markdown começa certa e
está errada em três semanas — o CSS muda, ninguém lembra de mexer no texto, e
aí a documentação passa a mentir, que é pior do que não existir. Aqui a página
não tem como divergir: se ela está desatualizada, é só rodar o comando de novo.

Quando mexer em token ou em classe de componente, rode `pnpm design-system` no
mesmo commit.

## Arquivos

| | |
|---|---|
| `gerar.mjs` | o gerador |
| `nunito-latin.woff2` | subset latino da Nunito (OFL), embutido como data URI na página |
| `logo-240.jpg` | o logo da associação reduzido, só para a vitrine — o original é `public/logo-amigos-do-nordeste.jpeg` |
| `site/` | saída. **Não edite à mão**, é sobrescrito a cada geração |

## Publicando no Claude Design

`site/cards/` sai no formato que o Claude Design espera: um arquivo por seção,
com o marcador `@dsCard` na primeira linha.

Para subir é preciso um terminal interativo, porque a autenticação
(`/design-login`) não roda em ambiente não interativo:

```bash
claude
```

E, dentro dele, `/design-login` seguido de `/design-sync`. O diretório a
apontar é `design-system/site`.
