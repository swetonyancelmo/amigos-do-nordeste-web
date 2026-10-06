import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/** O PDF do relatório sai como arquivo, gerado no navegador com os números da tela. */
test('relatórios: "Exportar PDF" baixa o relatório em PDF', async ({ page }, info) => {
  await usarApiFalsa(page);
  await page.goto('/relatorios');
  await page.waitForLoadState('networkidle');

  const botao = page.getByRole('button', { name: 'Exportar PDF' });
  await expect(botao).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent('download'), botao.click()]);

  expect(download.suggestedFilename()).toMatch(/^necessidades-\d{4}-\d{2}-\d{2}\.pdf$/);
  const caminho = info.outputPath('relatorio.pdf');
  await download.saveAs(caminho);
  const { readFileSync } = await import('node:fs');
  expect(readFileSync(caminho).subarray(0, 5).toString()).toBe('%PDF-');
});

test('início não tem mais o botão Imprimir', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toHaveCount(0);
});
