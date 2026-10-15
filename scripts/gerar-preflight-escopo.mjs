/*
 * Gera `src/app/preflight-escopo.css`: o preflight do Tailwind valendo SÓ
 * dentro da interface nova.
 *
 *   pnpm preflight-escopo
 *
 * Por quê: o preflight global (o que `@import "tailwindcss"` traz) zera
 * margem de título e de parágrafo, tira o marcador de lista, põe borda 0 em
 * tudo… e as telas antigas contam com o padrão do navegador. Medido em
 * 15/10/2026: com ele, 27 das 30 capturas das telas antigas mudaram.
 *
 * Então cada seletor do preflight oficial ganha a condição de estar dentro
 * de um destes:
 *   [data-slot]            todo primitivo do shadcn/ui carrega, inclusive o
 *                          conteúdo de diálogo, menu e select que o Radix
 *                          joga num portal no fim do <body>;
 *   [data-preflight]       marcador para tela inteira já migrada (e a /estilo);
 *   [data-sonner-toaster]  o contêiner dos avisos (sonner não usa data-slot).
 *
 * A regra de `html`/`:host` fica de fora: o <html> é das telas antigas.
 *
 * Quando a última tela migrar, este arquivo e o script saem, e o tailwind.css
 * volta a importar o preflight global (ver o comentário lá).
 *
 * Lê o preflight da versão INSTALADA do Tailwind: atualizou o Tailwind, rode
 * de novo e confira o diff.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const exigir = createRequire(join(RAIZ, 'package.json'));

const ESCOPO = [
  '[data-slot]', '[data-slot] *',
  '[data-preflight]', '[data-preflight] *',
  '[data-sonner-toaster]', '[data-sonner-toaster] *',
].join(', ');
const CONDICAO = `:where(${ESCOPO})`;

/** Separa "a, b:is(c, d)" nas vírgulas de fora dos parênteses. */
function separar(lista) {
  const partes = [];
  let nivel = 0;
  let atual = '';
  for (const c of lista) {
    if (c === '(') nivel++;
    if (c === ')') nivel--;
    if (c === ',' && nivel === 0) {
      partes.push(atual.trim());
      atual = '';
    } else {
      atual += c;
    }
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

/** Põe a condição no último elemento do seletor, antes do pseudo-elemento. */
function comEscopo(seletor) {
  let nivel = 0;
  for (let i = 0; i < seletor.length - 1; i++) {
    const c = seletor[i];
    if (c === '(') nivel++;
    if (c === ')') nivel--;
    if (nivel === 0 && c === ':' && seletor[i + 1] === ':') {
      return `${seletor.slice(0, i)}${CONDICAO}${seletor.slice(i)}`;
    }
  }
  return `${seletor}${CONDICAO}`;
}

const SO_DO_HTML = new Set(['html', ':host']);

const caminho = exigir.resolve('tailwindcss/preflight.css');
const versao = exigir('tailwindcss/package.json').version;
const raiz = postcss.parse(readFileSync(caminho, 'utf8'));

raiz.walkRules((regra) => {
  // Keyframes não têm seletor de elemento.
  if (regra.parent?.type === 'atrule' && /keyframes$/.test(regra.parent.name)) return;
  const seletores = separar(regra.selector).filter((s) => !SO_DO_HTML.has(s));
  if (seletores.length === 0) {
    regra.remove();
    return;
  }
  regra.selector = seletores.map(comEscopo).join(',\n');
});
raiz.walkComments((comentario) => comentario.remove());

const cabecalho = `/*
 * GERADO por scripts/gerar-preflight-escopo.mjs a partir de
 * tailwindcss@${versao}/preflight.css. Não edite à mão: rode
 * \`pnpm preflight-escopo\`.
 *
 * O preflight do Tailwind, mas só dentro de [data-slot], [data-preflight] e
 * [data-sonner-toaster]. As telas antigas continuam com o padrão do
 * navegador. Explicação completa no script.
 */
`;

writeFileSync(join(RAIZ, 'src/app/preflight-escopo.css'), `${cabecalho}\n${raiz.toString().trim()}\n`);
console.log(`preflight-escopo.css gerado (tailwindcss ${versao}).`);
