import { expect, test } from '@playwright/test';
import { usarApiFalsa } from './api-falsa';

/*
 * Prioridade sugerida (ADR-0010 da API) nas quatro frentes: lista, ficha,
 * Início e Priorização. A API falsa usa rótulos "Rótulo Falso …" de
 * propósito: se a tela mostrar outro texto, ela escreveu rótulo por conta
 * própria. Nomes fictícios, nenhum dado real.
 */

test.describe('lista de famílias', () => {
  test('cada linha mostra o estrato com o rótulo que a API mandou', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/familias');

    const linhaA = page.getByRole('row', { name: /Responsável Fictícia A/ });
    await expect(linhaA.getByText('Rótulo Falso R3')).toBeVisible();
    const linhaB = page.getByRole('row', { name: /Responsável Fictícia B/ });
    await expect(linhaB.getByText('Rótulo Falso Completar')).toBeVisible();
  });

  test('filtro e ordem por estrato vão para a API e para a URL, e sobrevivem ao recarregar', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/familias');

    const pedido = page.waitForRequest((r) => r.url().includes('/api/familias?') && r.url().includes('estrato=DADOS_INSUFICIENTES'));
    await page.getByRole('combobox', { name: 'Prioridade sugerida' }).selectOption({ label: 'Rótulo Falso Completar' });
    await pedido;
    await expect(page).toHaveURL(/estrato=DADOS_INSUFICIENTES/);
    await expect(page.getByRole('row', { name: /Responsável Fictícia A/ })).toHaveCount(0);

    const pedidoOrdem = page.waitForRequest((r) => r.url().includes('ordenacao=PRIORIDADE'));
    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('PRIORIDADE');
    await pedidoOrdem;
    await expect(page).toHaveURL(/ordenacao=PRIORIDADE/);

    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Prioridade sugerida' })).toHaveValue('DADOS_INSUFICIENTES');
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('PRIORIDADE');
  });

  test('código de estrato que o front não conhece mostra o rótulo da API, sem quebrar', async ({ page }) => {
    await usarApiFalsa(page);
    await page.route('**/api/familias?*', (rota) => rota.fulfill({
      json: {
        itens: [{
          id: 'fam-9', responsavelNome: 'Responsável Fictícia Nova', comunidadeId: 'com-1', comunidadeNome: 'Sítio Fictício',
          municipioNome: 'Município Teste', ativa: true, semBanheiro: false, totalPessoas: 1, totalAte12Anos: 0,
          totalDe13A59Anos: 1, total60AnosOuMais: 0, totalSemIdadeConhecida: 0,
          vulnerabilidade: { estrato: 'R9_NOVO', rotulo: 'Estrato novo da API', escore: 4, pontosConfirmados: 4 },
        }],
        pagina: 0, porPagina: 20, total: 1, totalPaginas: 1,
      },
    }));
    await page.goto('/familias');
    await expect(page.getByText('Estrato novo da API')).toBeVisible();
  });

  test('erro diz o que fazer e o botão tenta de novo; vazio não é erro', async ({ page }) => {
    await usarApiFalsa(page);
    // falha até o teste liberar (em dev o React chama o efeito duas vezes)
    let falhar = true;
    await page.route('**/api/familias?*', async (rota) => {
      if (falhar) {
        await rota.fulfill({ status: 502, body: '' });
        return;
      }
      await rota.fulfill({ json: { itens: [], pagina: 0, porPagina: 20, total: 0, totalPaginas: 0 } });
    });
    await page.goto('/familias');

    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível falar com o servidor' })).toBeVisible();
    await expect(page.getByText('Nenhuma família encontrada')).toHaveCount(0);
    falhar = false;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(page.getByText('Nenhuma família encontrada com esses filtros.')).toBeVisible();
  });
});

test.describe('ficha da família', () => {
  test('painel explica o escore: sentinelas com peso, instrumento e a frase de que é sugestão', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/familias');
    await page.getByRole('button', { name: 'Responsável Fictícia A' }).click();

    const painel = page.getByRole('region', { name: 'Prioridade sugerida' });
    await expect(painel.getByText('Rótulo Falso R3')).toBeVisible();
    await expect(painel.getByText(/sugestão de prioridade, não uma decisão/)).toBeVisible();
    await expect(painel.getByText(/Soma\s*9 pontos\s*de 10 possíveis/)).toBeVisible();
    await expect(painel.getByText('Baixas condições de saneamento')).toBeVisible();
    await expect(painel.getByText('+3 pontos').first()).toBeVisible();
    await expect(painel.getByText('Avaliado e não se aplica')).toBeVisible();
    await expect(painel.getByText(/Coelho-Savassi/)).toBeVisible();
    // nada de código técnico na tela
    await expect(painel.getByText('BAIXAS_CONDICOES_SANEAMENTO')).toHaveCount(0);
  });

  test('cadastro a completar: mostra o que falta, separa o indeterminado e leva para a edição', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/familias');
    await page.getByRole('button', { name: 'Responsável Fictícia B' }).click();

    const painel = page.getByRole('region', { name: 'Prioridade sugerida' });
    await expect(painel.getByText('Cadastro incompleto — completar para avaliar')).toBeVisible();
    await expect(painel.getByText('Não deu para avaliar: falta dado no cadastro')).toBeVisible();
    await expect(painel.getByText('Se a casa tem banheiro')).toBeVisible();
    await expect(painel.getByText(/Número de cômodos da casa/)).toBeVisible();
    await expect(painel.getByText('(ainda não dá para preencher pelo painel)')).toBeVisible();
    await expect(painel.getByRole('link', { name: 'Completar cadastro' })).toHaveAttribute('href', '/familias/fam-2/editar');
  });
});

test('Início: a contagem de cadastros a completar leva à lista já filtrada', async ({ page }) => {
  await usarApiFalsa(page);
  await page.goto('/inicio');

  const secao = page.getByRole('region', { name: 'Prioridade sugerida' });
  await expect(secao.getByText('Rótulo Falso R3')).toBeVisible();
  await secao.getByRole('link', { name: /1 a completar/ }).click();
  await expect(page).toHaveURL(/\/familias\?estrato=DADOS_INSUFICIENTES/);
  await expect(page.getByRole('combobox', { name: 'Prioridade sugerida' })).toHaveValue('DADOS_INSUFICIENTES');
});

test.describe('priorização', () => {
  test('famílias com posição por comunidade, e os cadastros a completar em bloco próprio no fim', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/priorizacao');

    const ordem = page.getByRole('region', { name: /Famílias por prioridade sugerida/ });
    await expect(ordem.getByRole('rowheader', { name: 'Responsável Fictícia A' })).toBeVisible();
    await expect(ordem.getByText('Responsável Fictícia B')).toHaveCount(0);

    const completar = page.getByRole('region', { name: /Cadastros a completar/ });
    await expect(completar.getByRole('rowheader', { name: 'Responsável Fictícia B' })).toBeVisible();

    // o bloco a completar vem depois da ordenação
    const yOrdem = (await ordem.boundingBox())!.y;
    const yCompletar = (await completar.boundingBox())!.y;
    expect(yCompletar).toBeGreaterThan(yOrdem);

    // totais por município e por comunidade
    await expect(page.getByRole('table', { name: 'Por município' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Por comunidade' })).toBeVisible();
  });

  test('no papel: sem navegação nem filtros, estrato legível em texto', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/priorizacao');
    await expect(page.getByRole('rowheader', { name: 'Responsável Fictícia A' })).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden();
    await expect(page.getByRole('combobox', { name: 'Município' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
    await expect(page.getByText('Rótulo Falso R3').first()).toBeVisible();
    await expect(page.getByText(/sugestão de prioridade, não uma decisão/)).toBeVisible();
  });

  test('servidor dormindo: o carregamento explica a espera em vez de parecer travado', async ({ page }) => {
    await usarApiFalsa(page);
    await page.route('**/api/relatorios/vulnerabilidade*', async (rota) => {
      await new Promise((r) => setTimeout(r, 7_000));
      await rota.fallback();
    });
    await page.goto('/priorizacao');

    await expect(page.getByText(/Carregando a priorização/)).toBeVisible();
    await expect(page.getByText(/servidor estava em repouso e está acordando/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('rowheader', { name: 'Responsável Fictícia A' })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('como a prioridade é calculada', () => {
  test('a tabela vem da API, fica recolhida na tela e abre no botão', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/priorizacao');

    const secao = page.getByRole('region', { name: 'Como a prioridade é calculada' });
    const botao = secao.getByRole('button', { name: 'Ver a tabela' });
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(secao.getByRole('table', { name: 'Situações que somam pontos' })).toBeHidden();

    await botao.click();
    const situacoes = secao.getByRole('table', { name: 'Situações que somam pontos' });
    await expect(situacoes).toBeVisible();
    // peso que só a API falsa tem: a tela não inventa número
    await expect(situacoes.getByRole('row', { name: /Baixas condições de saneamento/ })).toContainText('4');
    await expect(situacoes.getByText('Critério falso de saneamento.')).toBeVisible();
    await expect(situacoes.getByText('mais de 1 morador por cômodo: 3 pontos')).toBeVisible();

    const estratos = secao.getByRole('table', { name: 'Da soma à prioridade sugerida' });
    await expect(estratos.getByRole('row', { name: /Rótulo Falso R3/ })).toContainText('9 ou mais');
    await expect(estratos.getByRole('row', { name: /Rótulo Falso R2/ })).toContainText('7 a 8');

    await expect(secao.getByRole('table', { name: /não usa/ }).getByText('Justificativa falsa de saúde.')).toBeVisible();
    await expect(secao.getByText(/no máximo 11 pontos/)).toBeVisible();
    await expect(secao.getByRole('link', { name: /doi\.org/ })).toHaveAttribute('href', /10\.5712/);
  });

  test('no papel a tabela sai mesmo recolhida', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/priorizacao');
    const secao = page.getByRole('region', { name: 'Como a prioridade é calculada' });
    await expect(secao.getByRole('button', { name: 'Ver a tabela' })).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(secao.getByRole('table', { name: 'Situações que somam pontos' })).toBeVisible();
    await expect(secao.getByRole('button', { name: 'Ver a tabela' })).toBeHidden();
  });

  test('o link da ficha leva à tabela já aberta', async ({ page }) => {
    await usarApiFalsa(page);
    await page.goto('/familias');
    await page.getByRole('button', { name: 'Responsável Fictícia A' }).click();
    await page.getByRole('link', { name: 'Ver a tabela completa de pontos' }).click();

    await expect(page).toHaveURL(/\/priorizacao#como-a-prioridade-e-calculada/);
    await expect(page.getByRole('table', { name: 'Situações que somam pontos' })).toBeVisible();
  });
});
