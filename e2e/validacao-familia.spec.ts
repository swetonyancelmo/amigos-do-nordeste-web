import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

test('nova família: todos os erros aparecem junto do campo e o foco vai para o primeiro', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias/nova');
  await expect(page.getByRole('heading', { level: 1, name: 'Nova família' })).toBeVisible();

  await page.getByRole('button', { name: 'Salvar família' }).click();

  const comunidade = page.getByLabel('Comunidade', { exact: true });
  const nome = page.getByLabel('Nome da responsável');

  // Os dois campos obrigatórios marcados ao mesmo tempo, com a mensagem ligada.
  await expect(comunidade).toHaveAttribute('aria-invalid', 'true');
  await expect(nome).toHaveAttribute('aria-invalid', 'true');
  await expect(comunidade).toHaveAccessibleDescription('Escolha a comunidade da família.');
  await expect(nome).toHaveAccessibleDescription('Informe o nome da responsável.');

  // Foco no primeiro campo inválido.
  await expect(comunidade).toBeFocused();

  // O aviso geral continua com role="alert" e lista os dois erros.
  const alerta = page.getByRole('alert').filter({ hasText: 'Não deu para salvar' });
  await expect(alerta).toContainText('Escolha a comunidade da família.');
  await expect(alerta).toContainText('Informe o nome da responsável.');

  // Corrigiu o campo, o erro dele some.
  await nome.fill('Responsável Fictícia D');
  await expect(nome).not.toHaveAttribute('aria-invalid', 'true');
});
