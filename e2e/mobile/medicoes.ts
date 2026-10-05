import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';

/**
 * Medições de celular que rodam dentro da página e devolvem os achados em vez
 * de parar no primeiro erro: a ideia é sair com a lista inteira para revisar.
 * Cada spec grava o que achou em test-results/mobile/achados/ (ignorado no git).
 */

export const PASTA = path.join('test-results', 'mobile');

export const slug = (texto: string) =>
  texto.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'raiz';

export async function fotografar(page: Page, info: TestInfo, nome: string, telaInteira = true) {
  const arquivo = path.join(PASTA, info.project.name, `${nome}.png`);
  await page.screenshot({ path: arquivo, fullPage: telaInteira });
  return arquivo;
}

export function gravarAchados(info: TestInfo, nome: string, dados: unknown) {
  const pasta = path.join(PASTA, 'achados');
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, `${info.project.name}--${nome}.json`), JSON.stringify(dados, null, 2));
}

export async function violacoesAxe(page: Page, incluir?: string) {
  let construtor = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('nextjs-portal');
  if (incluir) construtor = construtor.include(incluir);
  const resultado = await construtor.analyze();
  return resultado.violations.map((v) => ({
    regra: v.id,
    impacto: v.impact,
    criterios: v.tags.filter((t) => /^wcag\d{3,}$/.test(t)),
    descricao: v.help,
    alvos: v.nodes.map((n) => n.target.join(' ')).slice(0, 6),
  }));
}

/** Rolagem horizontal da página e o que passa da borda direita (inclusive o que `overflow: clip` corta). */
export function rolagemHorizontal(page: Page) {
  return page.evaluate(() => {
    const raiz = document.documentElement;
    const largura = raiz.clientWidth;
    const escondido = (el: Element) =>
      !!el.closest('[inert], .so-leitor-de-tela, nextjs-portal, [aria-hidden="true"]');
    const rolaSozinho = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return true;
      }
      return false;
    };
    const vazando: { elemento: string; direita: number; texto: string }[] = [];
    const externos: Element[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || escondido(el) || rolaSozinho(el)) continue;
      if (r.right > largura + 1 && r.left < largura) {
        // Fica só o mais externo: os filhos dele vazam junto.
        if (externos.some((e) => e.contains(el))) continue;
        externos.push(el);
        const classe = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : '';
        vazando.push({
          elemento: `${el.tagName.toLowerCase()}${classe}`,
          direita: Math.round(r.right),
          texto: (el.textContent ?? '').trim().slice(0, 50),
        });
      }
    }
    return {
      larguraTela: largura,
      larguraConteudo: raiz.scrollWidth,
      temRolagem: raiz.scrollWidth > largura || document.body.scrollWidth > largura,
      vazando: vazando.slice(0, 10),
    };
  });
}

/**
 * Alvos de toque visíveis. Caixa de marcar conta junto com o <label> dela (o
 * toque no rótulo marca). Abaixo de 24px, aplica as exceções da 2.5.8: link no
 * meio de texto e espaçamento (círculo de 24px sem encostar em outro alvo).
 */
export function alvosDeToque(page: Page) {
  return page.evaluate(() => {
    const SELETOR = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="tab"], [tabindex]:not([tabindex="-1"])';
    const largura = document.documentElement.clientWidth;
    type Caixa = { x: number; y: number; w: number; h: number };
    const itens: { el: Element; caixa: Caixa; nome: string; emTexto: boolean }[] = [];

    for (const el of Array.from(document.querySelectorAll(SELETOR))) {
      if (el.closest('[inert], nextjs-portal, .so-leitor-de-tela')) continue;
      const estilo = getComputedStyle(el);
      if (estilo.visibility === 'hidden' || estilo.display === 'none') continue;
      let r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= 0 || r.left >= largura) continue;

      const entrada = el as HTMLInputElement;
      if ((entrada.type === 'checkbox' || entrada.type === 'radio') && entrada.labels?.[0]) {
        const l = entrada.labels[0].getBoundingClientRect();
        const x = Math.min(r.left, l.left), y = Math.min(r.top, l.top);
        r = new DOMRect(x, y, Math.max(r.right, l.right) - x, Math.max(r.bottom, l.bottom) - y);
      }
      const nome = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || entrada.labels?.[0]?.innerText
        || el.getAttribute('placeholder') || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50);
      const emTexto = el.tagName === 'A' && estilo.display === 'inline'
        && Array.from(el.parentElement?.childNodes ?? []).some((n) => n.nodeType === 3 && n.textContent!.trim() !== '');
      itens.push({ el, caixa: { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }, nome, emTexto });
    }

    const centro = (c: Caixa) => ({ cx: c.x + c.w / 2, cy: c.y + c.h / 2 });
    const distanciaAoRetangulo = (px: number, py: number, c: Caixa) => {
      const dx = Math.max(c.x - px, 0, px - (c.x + c.w));
      const dy = Math.max(c.y - py, 0, py - (c.y + c.h));
      return Math.hypot(dx, dy);
    };
    const pequeno = (c: Caixa) => c.w < 24 || c.h < 24;

    return itens
      .filter((i) => i.caixa.w < 44 || i.caixa.h < 44)
      .map((i) => {
        let excecao: string | null = null;
        if (pequeno(i.caixa)) {
          if (i.emTexto) excecao = 'link no meio do texto';
          else {
            const { cx, cy } = centro(i.caixa);
            const livre = itens.every((o) => {
              if (o === i || o.el.contains(i.el) || i.el.contains(o.el)) return true;
              if (pequeno(o.caixa)) {
                const c = centro(o.caixa);
                return Math.hypot(c.cx - cx, c.cy - cy) >= 24;
              }
              return distanciaAoRetangulo(cx, cy, o.caixa) >= 12;
            });
            if (livre) excecao = 'espaçamento (círculo de 24px livre)';
          }
        }
        return {
          nome: i.nome,
          elemento: i.el.tagName.toLowerCase() + ((i.el as HTMLInputElement).type ? `[type=${(i.el as HTMLInputElement).type}]` : ''),
          largura: Math.round(i.caixa.w),
          altura: Math.round(i.caixa.h),
          falha258: pequeno(i.caixa) && excecao === null,
          excecao,
        };
      });
  });
}

/** Texto visível com fonte abaixo do mínimo (inclui ::before/::after com `content`). */
export function textosPequenos(page: Page, minimo = 12) {
  return page.evaluate((minimo) => {
    const largura = document.documentElement.clientWidth;
    const achados = new Map<string, { texto: string; tamanho: number; elemento: string }>();
    const visivel = (el: Element) => {
      if (el.closest('[inert], .so-leitor-de-tela, nextjs-portal, [aria-hidden="true"] svg')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && r.right > 0 && r.left < largura && getComputedStyle(el).visibility !== 'hidden';
    };
    const anotar = (el: Element, texto: string, tamanho: number) => {
      const classe = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : '';
      const elemento = `${el.tagName.toLowerCase()}${classe}`;
      const chave = `${elemento}|${tamanho}`;
      if (!achados.has(chave)) achados.set(chave, { texto: texto.slice(0, 40), tamanho, elemento });
    };

    const caminhante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = caminhante.nextNode(); n; n = caminhante.nextNode()) {
      const texto = n.textContent?.trim();
      const pai = n.parentElement;
      if (!texto || !pai || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(pai.tagName) || !visivel(pai)) continue;
      const tamanho = parseFloat(getComputedStyle(pai).fontSize);
      if (tamanho < minimo) anotar(pai, texto, tamanho);
    }
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      for (const pseudo of ['::before', '::after']) {
        const estilo = getComputedStyle(el, pseudo);
        const conteudo = estilo.content;
        if (!conteudo || conteudo === 'none' || conteudo === 'normal' || conteudo === '""' || !visivel(el)) continue;
        const tamanho = parseFloat(estilo.fontSize);
        if (tamanho < minimo) anotar(el, `${pseudo} ${conteudo}`, tamanho);
      }
    }
    return Array.from(achados.values());
  }, minimo);
}

/** Campos com fonte < 16px: o Safari do iPhone dá zoom sozinho ao focar. */
export function camposQueDaoZoomNoIphone(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea'))
      .filter((el) => !el.closest('[inert]') && (el as HTMLElement).offsetParent !== null)
      .map((el) => ({
        campo: (el as HTMLInputElement).labels?.[0]?.innerText.trim() || el.getAttribute('aria-label') || el.tagName,
        tamanho: parseFloat(getComputedStyle(el).fontSize),
      }))
      .filter((c) => c.tamanho < 16));
}

export function metaViewport(page: Page) {
  return page.evaluate(() => {
    const conteudo = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null;
    const bloqueia = !!conteudo && (/user-scalable\s*=\s*(no|0)/i.test(conteudo)
      || /maximum-scale\s*=\s*(1(\.0+)?|0?\.\d+)\b/i.test(conteudo));
    return { conteudo, bloqueia };
  });
}

/**
 * Conteúdo cortado na lateral por um ancestral com `overflow-x: clip/hidden`:
 * não gera rolagem (passa no scrollWidth), mas some da tela. Ignora o que é
 * escondido de propósito (cabeçalho de tabela em modo cartão, mapa, leitor de tela).
 */
export function conteudoCortado(page: Page) {
  return page.evaluate(() => {
    const achados: string[] = [];
    for (const el of Array.from(document.querySelectorAll('main *'))) {
      if (el.closest('thead, .leaflet-container, .so-leitor-de-tela, [inert], [aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      for (let p = el.parentElement; p && p.tagName !== 'BODY'; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll') break;
        if (o === 'clip' || o === 'hidden') {
          const pr = p.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) {
            const classe = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : '';
            achados.push(`${el.tagName.toLowerCase()}${classe}`);
          }
          break;
        }
      }
    }
    return [...new Set(achados)].slice(0, 10);
  });
}
