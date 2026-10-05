import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/** Itens de baixa prioridade do relatório (6 a 9), que o axe não cobre sozinho. */

test('famílias: nome com alvo de 24px e tabela com caption', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias');
  const nome = page.getByRole('button', { name: 'Responsável Fictícia A' });
  await expect(nome).toBeVisible();

  const caixa = await nome.boundingBox();
  expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(24);
  await expect(page.getByRole('table', { name: /Famílias cadastradas/ })).toBeVisible();
});

test('nova família: rótulo de campo com pelo menos 14px', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias/nova');
  const rotulo = page.locator('.campo__rotulo').first();
  await expect(rotulo).toBeVisible();
  const px = await rotulo.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(px).toBeGreaterThanOrEqual(14);
});

test('início: botões de zoom do mapa em português', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/inicio');
  await expect(page.getByRole('button', { name: 'Aproximar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Afastar' })).toBeVisible();
});

test('início: Perfil e Sair continuam à vista depois de rolar a página', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await usarApiFalsa(page);
  await page.goto('/inicio');
  await page.waitForLoadState('networkidle');
  await page.mouse.wheel(0, 2000);

  await expect(page.getByRole('button', { name: 'Sair' })).toBeInViewport();
  await expect(page.getByRole('link', { name: /perfil/i })).toBeInViewport();
});
