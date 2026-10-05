import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

test('modal da família: foco entra, Tab fica preso, Esc fecha e devolve o foco', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias');

  const abrir = page.getByRole('button', { name: 'Responsável Fictícia A' });
  await abrir.focus();
  await page.keyboard.press('Enter');

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  // Foco inicial dentro do modal.
  await expect(modal.getByRole('button', { name: 'Fechar modal' })).toBeFocused();

  // Vai e volta com Tab muitas vezes: o foco nunca sai do modal.
  const dentroDoModal = () => page.evaluate(() => {
    const painel = document.querySelector('[role="dialog"]');
    return !!painel && painel.contains(document.activeElement);
  });
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Tab');
    expect(await dentroDoModal()).toBe(true);
  }
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await dentroDoModal()).toBe(true);
  }

  // Esc fecha e o foco volta para o botão que abriu.
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(abrir).toBeFocused();
});
