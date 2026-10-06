import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/** Telas avaliadas no relatório de 05/10/2026, com o título que o cabeçalho mostra. */
const TELAS = [
  { rota: '/inicio', titulo: 'Início' },
  { rota: '/familias', titulo: 'Famílias' },
  { rota: '/familias/nova', titulo: 'Nova família' },
  { rota: '/familias/fam-1/editar', titulo: 'Editar família de Responsável Fictícia A' },
  { rota: '/familias/nao-existe/editar', titulo: 'Editar família' },
  { rota: '/chamados', titulo: 'Chamados' },
  { rota: '/agentes', titulo: 'Agentes' },
  { rota: '/pessoas', titulo: 'Pessoas' },
  { rota: '/comunidades', titulo: 'Comunidades' },
  { rota: '/relatorios', titulo: 'Necessidades da comunidade' },
  { rota: '/perfil', titulo: 'Perfil' },
];

for (const { rota, titulo } of TELAS) {
  test(`${rota} não tem violação WCAG 2.1 AA`, async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto(rota);
    await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Problemas 4 e 5 do relatório: um <main> e um <h1> por tela.
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);

    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Sobreposição de desenvolvimento do Next, que não existe em produção.
      .exclude('nextjs-portal')
      .analyze();

    const resumo = resultado.violations.map((v) => ({
      regra: v.id,
      impacto: v.impact,
      alvos: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
    }));
    expect(resumo).toEqual([]);
  });
}
