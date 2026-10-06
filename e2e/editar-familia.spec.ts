import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

const TITULO = 'Editar família de Responsável Fictícia A';

async function abrirEdicao(page: Page) {
  await usarApiFalsa(page);
  await page.goto('/familias/fam-1/editar');
  await expect(page.getByRole('heading', { level: 1, name: TITULO })).toBeVisible();
}

/** Violações WCAG 2.1 AA na tela como ela está agora (mesmo filtro do axe.spec). */
async function violacoes(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('nextjs-portal')
    .analyze();
  return resultado.violations.map((v) => ({ regra: v.id, alvos: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) }));
}

/** Corpos de PUT enviados, para conferir o que foi (ou não) gravado. */
function gravarPuts(page: Page) {
  const corpos: Record<string, unknown>[] = [];
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/api/familias/')) corpos.push(req.postDataJSON());
  });
  return corpos;
}

test('a ficha da família abre a edição pelo botão Editar', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias');
  await page.getByRole('button', { name: 'Responsável Fictícia A' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Família de Responsável Fictícia A' });
  await expect(dialogo.getByRole('link', { name: 'Editar família de Responsável Fictícia A' })).toBeVisible();
  expect(await violacoes(page)).toEqual([]);
  await dialogo.getByRole('link', { name: 'Editar família de Responsável Fictícia A' }).click();

  await expect(page).toHaveURL(/\/familias\/fam-1\/editar$/);
  await expect(page.getByRole('heading', { level: 1, name: TITULO })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
});

test('edição carrega com os dados da família preenchidos', async ({ page }) => {
  await abrirEdicao(page);

  await expect(page.getByLabel('Comunidade', { exact: true })).toHaveValue('com-1');
  await expect(page.getByLabel('Nome da responsável')).toHaveValue('Responsável Fictícia A');
  await expect(page.getByLabel('Telefone')).toHaveValue('(87) 90000-0000');
  await expect(page.getByLabel('Ponto de referência')).toHaveValue('Depois da cisterna fictícia');

  // Pessoas da casa, na ordem da ficha. A estimada aparece com a idade de hoje.
  const nomes = page.getByLabel('Nome', { exact: true });
  await expect(nomes).toHaveCount(2);
  await expect(nomes.nth(0)).toHaveValue('Responsável Fictícia A');
  await expect(nomes.nth(1)).toHaveValue('Criança Teste');
  await expect(page.getByLabel('Data de nascimento').nth(0)).toHaveValue('1992-01-01');
  await expect(page.getByLabel('Idade estimada').nth(1)).toHaveValue('7');
  await expect(page.getByLabel('Série')).toHaveValue('ANO_1');

  // Moradia e abastecimento de água.
  await expect(page.getByLabel('Tem banheiro?')).toHaveValue('false');
  await expect(page.getByLabel('Escoamento sanitário')).toHaveValue('CEU_ABERTO');
  await expect(page.getByLabel('Tratamento da água')).toHaveValue('FERVIDA');
  await expect(page.getByRole('checkbox', { name: 'Cisterna' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Carro-pipa' })).not.toBeChecked();

  // Renda.
  await expect(page.getByLabel('Quanto entra na casa por mês, somando tudo')).toHaveValue('ATE_1_SALARIO');
  await expect(page.getByLabel('Tipo', { exact: true })).toHaveValue('BOLSA_FAMILIA');
  await expect(page.getByLabel('Quem recebe').locator('option:checked')).toHaveText('Responsável Fictícia A');
});

test('edição: campo obrigatório apagado mostra o erro no campo, foca e alerta', async ({ page }) => {
  const puts = gravarPuts(page);
  await abrirEdicao(page);

  const nome = page.getByLabel('Nome da responsável');
  await nome.fill('');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(nome).toHaveAttribute('aria-invalid', 'true');
  await expect(nome).toHaveAccessibleDescription('Informe o nome da responsável.');
  await expect(nome).toBeFocused();
  await expect(page.getByRole('alert').filter({ hasText: 'Não deu para salvar' }))
    .toContainText('Informe o nome da responsável.');
  expect(puts).toHaveLength(0);

  await nome.fill('Responsável Fictícia A');
  await expect(nome).not.toHaveAttribute('aria-invalid', 'true');
});

test('edição: salvar grava pelo PUT, volta para a lista e anuncia "Família atualizada"', async ({ page }) => {
  await abrirEdicao(page);
  await page.getByLabel('Telefone').fill('(87) 91111-1111');

  const [requisicao] = await Promise.all([
    page.waitForRequest((r) => r.method() === 'PUT' && r.url().endsWith('/api/familias/fam-1')),
    page.getByRole('button', { name: 'Salvar alterações' }).click(),
  ]);
  const corpo = requisicao.postDataJSON();

  expect(corpo.telefone).toBe('(87) 91111-1111');
  expect(corpo.abastecimentoAgua).toEqual(['CISTERNA']);
  // Pessoa e fonte já salvas vão com id; a fonte aponta para a pessoa pelo id.
  expect(corpo.pessoas.map((p: { id: string }) => p.id)).toEqual(['pes-1', 'pes-2']);
  expect(corpo.fontesRenda).toEqual([{ id: 'ren-1', tipo: 'BOLSA_FAMILIA', pessoaId: 'pes-1', observacao: null }]);
  // O que a tela não mexeu volta como veio: estimativa original e observações.
  expect(corpo.pessoas[1]).toMatchObject({
    idadeEstimada: 6, idadeEstimadaEm: '2025-09-01', observacoes: 'Observação fictícia',
  });

  await expect(page).toHaveURL(/\/familias$/);
  await expect(page.getByRole('status').filter({ hasText: 'Família atualizada' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await violacoes(page)).toEqual([]);
});

test('edição: Cancelar volta para a lista sem salvar', async ({ page }) => {
  const puts = gravarPuts(page);
  await abrirEdicao(page);
  await page.getByLabel('Telefone').fill('(87) 92222-2222');

  await page.getByRole('link', { name: 'Cancelar' }).click();

  await expect(page).toHaveURL(/\/familias$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Famílias' })).toBeVisible();
  expect(puts).toHaveLength(0);
  await expect(page.getByText('Família atualizada')).toHaveCount(0);
});

test('edição de família que não existe mostra mensagem clara', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/familias/nao-existe/editar');

  await expect(page.getByRole('heading', { level: 1, name: 'Editar família' })).toBeVisible();
  await expect(page.getByText('Família não encontrada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar para a lista' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
});
