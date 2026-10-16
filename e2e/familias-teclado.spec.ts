import { expect, test, type Page } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/*
 * Famílias na interface nova: ordem do Tab, diálogo de inativar e filtro
 * ativo que não depende só da cor. Nomes fictícios da API falsa.
 */

const nomeDoFoco = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return '';
    const rotulo = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : null;
    return (el.getAttribute('aria-label') ?? rotulo ?? el.textContent ?? '').trim();
  });

test('Tab percorre busca, filtros, tabela e paginação, nessa ordem', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias');
  await expect(page.getByRole('button', { name: 'Responsável Fictícia B' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Buscar pelo nome da responsável' }).focus();
  const ordem: string[] = [await nomeDoFoco(page)];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    ordem.push(await nomeDoFoco(page));
  }
  expect(ordem).toEqual([
    'Buscar pelo nome da responsável',
    'Comunidade',
    'Prioridade sugerida',
    'Ordenar',
    'Sem banheiro',
    'Incluir inativas',
    'Responsável Fictícia A',
    'Responsável Fictícia B',
    'Itens por página:',
  ]);
});

test('inativar: diálogo prende o foco, Esc fecha e devolve o foco ao botão; confirmar chama a API', async ({ page }) => {
  await usarApiFalsa(page);
  let inativou = false;
  await page.route('**/api/familias/fam-1/inativar', (rota) => {
    inativou = true;
    return rota.fulfill({ status: 204, body: '' });
  });
  await page.goto('/familias');
  await page.getByRole('button', { name: 'Responsável Fictícia A' }).click();
  const ficha = page.getByRole('dialog', { name: 'Família de Responsável Fictícia A' });
  await expect(ficha).toBeVisible();

  const inativar = ficha.getByRole('button', { name: 'Inativar família de Responsável Fictícia A' });
  await inativar.focus();
  await page.keyboard.press('Enter');

  const confirmacao = page.getByRole('dialog', { name: 'Inativar a família de Responsável Fictícia A?' });
  await expect(confirmacao).toBeVisible();
  await expect(confirmacao.getByText(/não é apagada/)).toBeVisible();
  // Foco inicial em Cancelar: Enter sem pensar não inativa.
  await expect(confirmacao.getByRole('button', { name: 'Cancelar' })).toBeFocused();

  const dentro = () => confirmacao.evaluate((d) => d.contains(document.activeElement));
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab');
    expect(await dentro()).toBe(true);
  }
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await dentro()).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(confirmacao).toBeHidden();
  await expect(ficha).toBeVisible(); // Esc fecha só a confirmação
  await expect(inativar).toBeFocused();
  expect(inativou).toBe(false);

  await inativar.click();
  await confirmacao.getByRole('button', { name: 'Inativar', exact: true }).click();
  await expect(page.getByRole('status').getByText('Família inativada.')).toBeVisible();
  await expect(ficha).toBeHidden();
  expect(inativou).toBe(true);
});

test('filtro de comunidade ativo se distingue sem cor: borda grossa, negrito e funil', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias');
  const comunidade = page.getByRole('combobox', { name: 'Comunidade' });

  const marcas = () => comunidade.evaluate((el) => {
    const s = getComputedStyle(el);
    return { borda: s.borderTopWidth, peso: s.fontWeight, funil: !!el.querySelector('svg.lucide-funnel') };
  });
  expect(await marcas()).toEqual({ borda: '1px', peso: '400', funil: false });

  await comunidade.click();
  await page.getByRole('option', { name: 'Sítio Fictício · Município Teste' }).click();
  await expect(page).toHaveURL(/comunidadeId=com-1/);
  expect(await marcas()).toEqual({ borda: '2px', peso: '600', funil: true });
});
