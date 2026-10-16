import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/*
 * axe (WCAG 2.1 AA) nos estados de Famílias que o axe.spec.ts não abre:
 * filtros ativos, lista do filtro aberta, ficha e confirmação de inativar.
 * Na largura do desktop e na do celular (o celular de verdade, com toque,
 * está em mobile/). Nomes fictícios da API falsa.
 */

async function violacoes(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('nextjs-portal')
    .analyze();
  return r.violations.map((v) => ({ regra: v.id, alvos: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
}

for (const largura of [1280, 412]) {
  test.describe(`${largura}px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test('filtros ativos e lista aberta', async ({ page }) => {
      await usarApiFalsa(page);
      await page.goto('/familias?municipioId=mun-1&estrato=R3&ordenacao=PRIORIDADE');
      await page.getByRole('button', { name: 'Sem banheiro' }).click();
      await expect(page.getByRole('button', { name: 'Sem banheiro' })).toHaveAttribute('aria-pressed', 'true');
      await page.waitForLoadState('networkidle');
      expect(await violacoes(page)).toEqual([]);

      const comunidade = page.getByRole('combobox', { name: 'Comunidade' });
      await comunidade.click();
      const lista = page.getByRole('listbox');
      await expect(lista).toBeVisible();
      // Lista aberta: o Radix põe aria-hidden no resto da página (padrão de
      // listbox modal) e o axe acusa aria-hidden-focus, porque os botões de
      // trás continuam focáveis em tese. Na prática o foco não sai da lista
      // (FocusScope preso e Tab bloqueado no Select do Radix): é o que as
      // linhas abaixo conferem com o teclado, antes de ignorar só essa regra
      // só neste estado.
      for (let i = 0; i < 3; i += 1) {
        await page.keyboard.press('Tab');
        expect(await lista.evaluate((l) => l.contains(document.activeElement))).toBe(true);
      }
      expect((await violacoes(page)).filter((v) => v.regra !== 'aria-hidden-focus')).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(lista).toBeHidden();
      await expect(comunidade).toBeFocused();
    });

    test('ficha e confirmação de inativar', async ({ page }) => {
      await usarApiFalsa(page);
      await page.goto('/familias');
      await page.getByRole('button', { name: 'Responsável Fictícia A' }).click();
      const ficha = page.getByRole('dialog', { name: 'Família de Responsável Fictícia A' });
      await expect(ficha.getByText('Criança Teste')).toBeVisible();
      expect(await violacoes(page)).toEqual([]);

      await ficha.getByRole('button', { name: /^Inativar família/ }).click();
      await expect(page.getByRole('dialog', { name: /^Inativar a família/ })).toBeVisible();
      expect(await violacoes(page)).toEqual([]);
    });
  });
}
