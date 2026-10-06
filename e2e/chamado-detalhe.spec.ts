import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

test('detalhe do chamado: uma única <h1> e zero violações no axe', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/chamados/pre-1');
  await expect(page.getByRole('heading', { level: 1, name: 'Responsável Fictícia C' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);

  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('nextjs-portal')
    .analyze();
  const resumo = resultado.violations.map((v) => ({
    regra: v.id,
    alvos: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
  }));
  expect(resumo).toEqual([]);
});
