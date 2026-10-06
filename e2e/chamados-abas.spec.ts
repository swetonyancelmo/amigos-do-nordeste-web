import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

test('abas de Chamados: setas trocam de aba, aria-selected e tabIndex acompanham', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/chamados');

  const lista = page.getByRole('tablist', { name: 'Situação dos chamados' });
  const esperando = lista.getByRole('tab', { name: /Esperando você/ });
  const aprovados = lista.getByRole('tab', { name: /Aprovados/ });
  const devolvidos = lista.getByRole('tab', { name: /Devolvidos/ });
  const painel = page.getByRole('tabpanel');

  await expect(esperando).toHaveAttribute('aria-selected', 'true');
  await expect(esperando).toHaveAttribute('tabindex', '0');
  await expect(aprovados).toHaveAttribute('tabindex', '-1');
  await expect(painel).toHaveAccessibleName(/Esperando você/);
  await expect(esperando).toHaveAttribute('aria-controls', (await painel.getAttribute('id'))!);

  // → vai para Aprovados: foco, seleção e conteúdo do painel mudam juntos.
  await esperando.focus();
  await page.keyboard.press('ArrowRight');
  await expect(aprovados).toBeFocused();
  await expect(aprovados).toHaveAttribute('aria-selected', 'true');
  await expect(esperando).toHaveAttribute('aria-selected', 'false');
  await expect(aprovados).toHaveAttribute('tabindex', '0');
  await expect(esperando).toHaveAttribute('tabindex', '-1');
  await expect(painel).toHaveAccessibleName(/Aprovados/);
  await expect(painel.getByText('Responsável Fictícia E')).toBeVisible();

  // ← duas vezes dá a volta até Devolvidos; Home volta ao início.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(devolvidos).toBeFocused();
  await expect(devolvidos).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(esperando).toBeFocused();
  await expect(esperando).toHaveAttribute('aria-selected', 'true');

  // Só a aba ativa entra no Tab: do tablist, o próximo Tab vai para o painel.
  await page.keyboard.press('Tab');
  await expect(painel).toBeFocused();
});

test('chamados: botão do card diz de quem é o chamado', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/chamados');
  const revisar = page.getByRole('link', { name: 'Revisar chamado de Responsável Fictícia C' });
  await expect(revisar).toBeVisible();
  await expect(revisar).toHaveText('Revisar');
});
