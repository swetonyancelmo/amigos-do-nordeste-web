import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/login', (rota) => rota.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ mensagem: 'E-mail ou senha incorretos.' }),
  }));
  await page.goto('/login');
});

test('login: foco no e-mail, sem violação WCAG e com o erro anunciado', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeFocused();

  await page.getByLabel('E-mail').fill('usuaria@teste.local');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Não deu para entrar' })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations).toEqual([]);
});

test('login: no celular, o botão Entrar cabe na primeira dobra', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeInViewport({ ratio: 1 });
});
