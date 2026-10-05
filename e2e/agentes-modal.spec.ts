import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

test.beforeEach(async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/agentes');
  await expect(page.getByText('Agente Teste', { exact: true })).toBeVisible();
});

test('modal Nova agente: foco entra no campo, Esc fecha e devolve o foco ao botão', async ({ page }) => {
  const abrir = page.getByRole('button', { name: 'Nova agente' });
  await abrir.focus();
  await page.keyboard.press('Enter');

  const modal = page.getByRole('dialog', { name: 'Nova agente' });
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel('Nome da agente')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(abrir).toBeFocused();
});

test('modal Nova agente: Cancelar também devolve o foco ao botão', async ({ page }) => {
  const abrir = page.getByRole('button', { name: 'Nova agente' });
  await abrir.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(abrir).toBeFocused();
});

test('modal Nova agente: salvar vazio leva o foco ao campo e anuncia o erro', async ({ page }) => {
  await page.getByRole('button', { name: 'Nova agente' }).click();
  const modal = page.getByRole('dialog', { name: 'Nova agente' });
  const campo = modal.getByLabel('Nome da agente');

  await modal.getByRole('button', { name: 'Cadastrar e gerar código' }).click();

  await expect(campo).toBeFocused();
  await expect(campo).toHaveAttribute('aria-invalid', 'true');
  await expect(campo).toHaveAccessibleDescription(/Informe o nome da agente\./);
  await expect(modal.getByRole('alert')).toContainText('Informe o nome da agente.');
});

test('agentes: Copiar e Gerar novo código dizem de qual agente são', async ({ page }) => {
  const copiar = page.getByRole('button', { name: 'Copiar código de Agente Fictícia Dois' });
  await expect(copiar).toHaveText('Copiar');
  await expect(page.getByRole('button', { name: 'Gerar novo código para Agente Teste' })).toHaveText('Gerar novo código');
  await expect(page.getByRole('button', { name: 'Gerar novo código para Agente Fictícia Dois' })).toBeVisible();
});
