import { expect, test } from '@playwright/test';
import { usarApiFalsa } from '../api-falsa';
import {
  alvosDeToque, camposQueDaoZoomNoIphone, conteudoCortado, fotografar, gravarAchados, metaViewport,
  rolagemHorizontal, slug, textosPequenos, violacoesAxe,
} from './medicoes';

/**
 * Cada tela no celular (projetos pixel-7 e iphone-13): axe, reflow na largura
 * do aparelho e em 320px, alvos de toque, texto mínimo e zoom liberado.
 * Usa `expect.soft` para medir tudo antes de reprovar; os números ficam em
 * test-results/mobile/achados/ e as fotos em test-results/mobile/<aparelho>/.
 */

const TELAS = [
  { rota: '/inicio', titulo: 'Início' },
  { rota: '/familias', titulo: 'Famílias' },
  { rota: '/familias/nova', titulo: 'Nova família' },
  { rota: '/familias/fam-1/editar', titulo: 'Editar família de Responsável Fictícia A' },
  { rota: '/chamados', titulo: 'Chamados' },
  { rota: '/agentes', titulo: 'Agentes' },
  { rota: '/pessoas', titulo: 'Pessoas' },
  { rota: '/comunidades', titulo: 'Comunidades' },
  { rota: '/relatorios', titulo: 'Relatórios' },
  { rota: '/perfil', titulo: 'Perfil' },
];

for (const { rota, titulo } of TELAS) {
  test(`${rota} no celular`, async ({ page }, info) => {
    await usarApiFalsa(page);
    await page.goto(rota);
    await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
    await page.waitForLoadState('networkidle');

    const tamanhoDoAparelho = page.viewportSize()!;
    const achados = {
      rota,
      aparelho: info.project.name,
      viewport: await metaViewport(page),
      axe: await violacoesAxe(page),
      rolagem: await rolagemHorizontal(page),
      alvos: await alvosDeToque(page),
      textosPequenos: await textosPequenos(page),
      zoomAoFocarNoIphone: await camposQueDaoZoomNoIphone(page),
      cortado: await conteudoCortado(page),
      rolagem320: null as Awaited<ReturnType<typeof rolagemHorizontal>> | null,
      cortado320: null as string[] | null,
      alvos320: null as Awaited<ReturnType<typeof alvosDeToque>> | null,
    };
    await fotografar(page, info, slug(rota));

    // WCAG 1.4.10: 320px de largura sem rolar para o lado.
    await page.setViewportSize({ width: 320, height: tamanhoDoAparelho.height });
    await page.waitForTimeout(300);
    achados.rolagem320 = await rolagemHorizontal(page);
    achados.cortado320 = await conteudoCortado(page);
    achados.alvos320 = (await alvosDeToque(page)).filter((a) => a.falha258);
    await fotografar(page, info, `${slug(rota)}--320px`);

    gravarAchados(info, slug(rota), achados);

    expect.soft(achados.viewport.bloqueia, `meta viewport: ${achados.viewport.conteudo}`).toBe(false);
    expect.soft(achados.axe, 'violações do axe').toEqual([]);
    expect.soft(achados.rolagem.temRolagem, 'rolagem horizontal no aparelho').toBe(false);
    expect.soft(achados.rolagem320.temRolagem, 'rolagem horizontal em 320px').toBe(false);
    expect.soft(achados.cortado, 'conteúdo cortado na lateral').toEqual([]);
    expect.soft(achados.cortado320, 'conteúdo cortado na lateral em 320px').toEqual([]);
    expect.soft(achados.zoomAoFocarNoIphone, 'campo com fonte < 16px (zoom no iPhone)').toEqual([]);
    expect.soft(achados.alvos.filter((a) => a.falha258), 'alvos de toque < 24px (2.5.8)').toEqual([]);
    expect.soft(achados.textosPequenos, 'texto abaixo de 12px').toEqual([]);
  });
}
