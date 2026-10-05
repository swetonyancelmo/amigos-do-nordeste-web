import { expect, test, type Page, type Route } from '@playwright/test';
import { usarApiFalsa } from '../api-falsa';
import { fotografar, gravarAchados, rolagemHorizontal, textosPequenos, violacoesAxe } from './medicoes';

/**
 * Fluxos com toque no celular. Todos os nomes são inventados ("Fictícia"):
 * nada de dado real de família em teste.
 */

const caminhoDe = (rota: Route) => new URL(rota.request().url()).pathname;

/* ------------------------------------------------------------------ menu */

test('menu lateral: abrir e fechar pelo toque', async ({ page }, info) => {
  await usarApiFalsa(page);
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();

  const abrir = page.getByRole('button', { name: /^Abrir menu/ });
  const menu = page.locator('nav.navegacao');
  const foco = () => page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return {
      noMenu: !!a && !!document.querySelector('nav.navegacao')?.contains(a),
      noBotaoAbrir: !!a?.classList.contains('navegacao__alternador'),
      elemento: a ? `${a.tagName.toLowerCase()} "${(a.getAttribute('aria-label') || a.innerText || '').trim().slice(0, 30)}"` : null,
    };
  });
  const esperarAnimacao = () => page.waitForTimeout(400);

  const antes = {
    ariaExpanded: await abrir.getAttribute('aria-expanded'),
    menuInert: await menu.evaluate((n) => n.hasAttribute('inert')),
    ariaControls: await abrir.getAttribute('aria-controls'),
  };

  await abrir.tap();
  await esperarAnimacao();
  const aberto = {
    ariaExpanded: await abrir.getAttribute('aria-expanded'),
    menuInert: await menu.evaluate((n) => n.hasAttribute('inert')),
    foco: await foco(),
    // Com o menu por cima, o resto da tela continua no Tab/leitor de tela?
    conteudoInert: await page.locator('.app__conteudo').evaluate((n) => n.closest('[inert], [aria-hidden="true"]') !== null),
    menuNaTela: await menu.evaluate((n) => {
      const r = n.getBoundingClientRect();
      return r.left >= 0 && r.right <= document.documentElement.clientWidth + 1;
    }),
  };
  await fotografar(page, info, 'fluxo--menu-aberto', false);

  // Tab com o menu aberto: o foco devia ficar dentro dele.
  const focosNoTab: boolean[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    focosNoTab.push((await foco()).noMenu);
  }

  await menu.getByRole('button', { name: 'Fechar menu' }).tap();
  await esperarAnimacao();
  const fechadoPeloX = {
    ariaExpanded: await abrir.getAttribute('aria-expanded'),
    menuInert: await menu.evaluate((n) => n.hasAttribute('inert')),
    foco: await foco(),
  };

  // Fechar pelo fundo escurecido e pelo Esc.
  await abrir.tap();
  await esperarAnimacao();
  await page.locator('button.navegacao__fundo').tap({ position: { x: 20, y: 300 } });
  await esperarAnimacao();
  const fechadoPeloFundo = { foco: await foco(), ariaExpanded: await abrir.getAttribute('aria-expanded') };

  await abrir.tap();
  await esperarAnimacao();
  await page.keyboard.press('Escape');
  await esperarAnimacao();
  const fechadoPeloEsc = { foco: await foco(), ariaExpanded: await abrir.getAttribute('aria-expanded') };

  const achados = { antes, aberto, focosNoTab, fechadoPeloX, fechadoPeloFundo, fechadoPeloEsc };
  gravarAchados(info, 'fluxo-menu', achados);

  expect.soft(antes.ariaExpanded).toBe('false');
  expect.soft(antes.menuInert, 'menu fechado tem inert').toBe(true);
  expect.soft(aberto.ariaExpanded).toBe('true');
  expect.soft(aberto.menuInert, 'menu aberto sem inert').toBe(false);
  expect.soft(aberto.foco.noMenu, `foco vai para o menu ao abrir (está em ${aberto.foco.elemento})`).toBe(true);
  expect.soft(focosNoTab.every(Boolean), 'Tab fica dentro do menu aberto').toBe(true);
  expect.soft(fechadoPeloX.ariaExpanded).toBe('false');
  expect.soft(fechadoPeloX.menuInert).toBe(true);
  expect.soft(fechadoPeloX.foco.noBotaoAbrir, `foco volta ao botão (está em ${fechadoPeloX.foco.elemento})`).toBe(true);
  expect.soft(fechadoPeloEsc.foco.noBotaoAbrir, 'Esc devolve o foco ao botão').toBe(true);
});

/* ------------------------------------------------------- cadastro e edição */

const COMUNIDADE = {
  id: 'com-1', nome: 'Sítio Fictício', municipioId: 'mun-1', municipioNome: 'Município Teste',
  tipoComunidade: 'SITIO', liderNome: null, liderTelefone: null, latitude: -8.6, longitude: -37.7, observacoes: null,
};

type Corpo = Record<string, unknown> & { pessoas: Record<string, unknown>[]; fontesRenda: Record<string, unknown>[] };

/** Monta a ficha (GET /familias/{id}) a partir do que o formulário mandou. */
function fichaDe(id: string, corpo: Corpo) {
  const pessoas = corpo.pessoas.map((p, i) => ({
    id: p.id ?? `pes-cel-${i + 1}`, cadastroIncompleto: !p.nome, idade: p.idadeEstimada ?? 30,
    nome: null, sexo: null, dataNascimento: null, idadeEstimada: null, idadeEstimadaEm: null,
    parentesco: null, estuda: null, serie: null, tamanhoRoupa: null, numeroCalcado: null,
    gestante: null, observacoes: null, ...p,
  }));
  const fontesRenda = corpo.fontesRenda.map((f, i) => ({
    id: f.id ?? `ren-cel-${i + 1}`, pessoaId: null, observacao: null, ...f,
  }));
  return {
    id, ativa: true, comunidade: COMUNIDADE, criadoEm: '2026-10-05T10:00:00Z', atualizadoEm: '2026-10-05T10:00:00Z',
    responsavelCpf: null, telefone: null, pontoReferencia: null, temBanheiro: null, escoamentoSanitario: null,
    tratamentoAgua: null, abastecimentoAgua: [], faixaRenda: null, observacoes: null,
    ...corpo, pessoas, fontesRenda,
    totais: {
      totalPessoas: pessoas.length, totalAte12Anos: 1, totalDe13A59Anos: 1, total60AnosOuMais: 0,
      totalSemIdadeConhecida: 0, totalPessoasEstudando: 1, totalFontesRenda: fontesRenda.length,
    },
  };
}

/** POST/GET/PUT de uma família nova, guardada em memória no próprio teste. */
async function apiDaFamiliaNova(page: Page) {
  const estado: { criada: ReturnType<typeof fichaDe> | null; post: Corpo | null; put: Corpo | null } =
    { criada: null, post: null, put: null };
  await page.route((url) => url.pathname.startsWith('/api/familias'), async (rota) => {
    const caminho = caminhoDe(rota);
    const metodo = rota.request().method();
    if (caminho === '/api/familias' && metodo === 'POST') {
      estado.post = rota.request().postDataJSON();
      estado.criada = fichaDe('fam-celular', estado.post!);
      const { totais } = estado.criada;
      await rota.fulfill({ status: 201, json: { ...estado.criada, comunidadeId: 'com-1', totais } });
      return;
    }
    if (caminho === '/api/familias/fam-celular' && estado.criada) {
      if (metodo === 'PUT') {
        estado.put = rota.request().postDataJSON();
        estado.criada = fichaDe('fam-celular', estado.put!);
      }
      await rota.fulfill({ status: 200, json: { ...estado.criada, comunidadeId: 'com-1' } });
      return;
    }
    await rota.fallback();
  });
  return estado;
}

test('cadastrar família de teste completa pelo toque e depois editar', async ({ page }, info) => {
  test.setTimeout(120_000); // WebKit preenchendo campo a campo + axe passa dos 30s
  await usarApiFalsa(page);
  const estado = await apiDaFamiliaNova(page);
  await page.goto('/familias/nova');
  await expect(page.getByRole('heading', { level: 1, name: 'Nova família' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const tocarEPreencher = async (rotulo: string, valor: string, n = 0) => {
    const campo = page.getByLabel(rotulo, { exact: true }).nth(n);
    await campo.tap();
    await campo.fill(valor);
  };
  const escolher = async (rotulo: string, valor: string, n = 0) => {
    const campo = page.getByLabel(rotulo, { exact: true }).nth(n);
    await campo.tap();
    await campo.selectOption(valor);
  };

  await escolher('Comunidade', 'com-1');
  await tocarEPreencher('Nome da responsável', 'Responsável Fictícia Celular');
  await tocarEPreencher('Telefone', '(87) 90000-1111');
  await tocarEPreencher('Ponto de referência', 'Ao lado da cisterna fictícia');

  // Pessoa 1 nasce com a responsável; se não, inclui.
  if (await page.getByLabel('Nome', { exact: true }).count() === 0) {
    await page.getByRole('button', { name: 'Adicionar pessoa' }).tap();
  }
  await escolher('Sexo', 'FEMININO', 0);
  await tocarEPreencher('Idade estimada', '35', 0);
  await escolher('Tamanho de roupa', 'ADULTO_M', 0);
  await escolher('Número do calçado', '38', 0);

  await page.getByRole('button', { name: 'Adicionar pessoa' }).tap();
  await tocarEPreencher('Nome', 'Criança Fictícia Celular', 1);
  await escolher('Parentesco', 'FILHO', 1);
  await escolher('Sexo', 'MASCULINO', 1);
  await tocarEPreencher('Idade estimada', '7', 1);
  await escolher('Estuda?', 'true', 1);
  await escolher('Série', 'ANO_1', 0);
  await escolher('Tamanho de roupa', 'INFANTIL_4', 1);
  await escolher('Número do calçado', '30', 1);

  await escolher('Tem banheiro?', 'false');
  await escolher('Escoamento sanitário', 'CEU_ABERTO');
  await escolher('Tratamento da água', 'FERVIDA');
  await page.getByRole('checkbox', { name: 'Cisterna' }).tap();

  await escolher('Quanto entra na casa por mês, somando tudo', 'ATE_1_SALARIO');
  await page.getByRole('button', { name: 'Adicionar fonte de renda' }).tap();
  await escolher('Tipo', 'BOLSA_FAMILIA');
  await tocarEPreencher('Observações', 'Cadastro de teste no celular');

  await fotografar(page, info, 'fluxo--cadastro-preenchido');
  const rolagemPreenchido = await rolagemHorizontal(page);
  const axePreenchido = await violacoesAxe(page);

  await page.getByRole('button', { name: 'Salvar família' }).tap();
  const aviso = page.getByText('Família cadastrada');
  await expect(aviso).toBeVisible();
  const avisoNaTela = await aviso.evaluate((n) => {
    const r = n.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  await fotografar(page, info, 'fluxo--cadastro-salvo', false);

  expect(estado.post).toMatchObject({
    comunidadeId: 'com-1', responsavelNome: 'Responsável Fictícia Celular', abastecimentoAgua: ['CISTERNA'],
  });
  expect(estado.post!.pessoas).toHaveLength(2);

  // Edição da família recém-criada. No WebKit o servidor de desenvolvimento às
  // vezes recarrega a tela logo depois do salvar; espera e tenta de novo.
  await page.waitForLoadState('networkidle');
  await page.goto('/familias/fam-celular/editar').catch(() => page.goto('/familias/fam-celular/editar'));
  await expect(page.getByRole('heading', { level: 1, name: 'Editar família de Responsável Fictícia Celular' })).toBeVisible();
  await expect(page.getByLabel('Telefone')).toHaveValue('(87) 90000-1111');
  await expect(page.getByLabel('Nome', { exact: true }).nth(1)).toHaveValue('Criança Fictícia Celular');
  await tocarEPreencher('Telefone', '(87) 90000-2222');
  await fotografar(page, info, 'fluxo--edicao');
  await page.getByRole('button', { name: 'Salvar alterações' }).tap();
  await expect(page).toHaveURL(/\/familias$/);
  await expect(page.getByRole('status').filter({ hasText: 'Família atualizada' })).toBeVisible();
  expect(estado.put).toMatchObject({ telefone: '(87) 90000-2222' });

  gravarAchados(info, 'fluxo-cadastro', { rolagemPreenchido, axePreenchido, avisoCadastradaVisivelSemRolar: avisoNaTela });
  expect.soft(rolagemPreenchido.temRolagem).toBe(false);
  expect.soft(axePreenchido).toEqual([]);
  expect.soft(avisoNaTela, 'aviso "Família cadastrada" aparece sem precisar rolar').toBe(true);
});

/* ------------------------------------------------------------------ modal */

test('ficha da família no modal: abrir e fechar pelo toque', async ({ page }, info) => {
  await usarApiFalsa(page);
  await page.goto('/familias');
  const abrir = page.getByRole('button', { name: 'Responsável Fictícia A' });
  await abrir.tap();

  const dialogo = page.getByRole('dialog', { name: 'Família de Responsável Fictícia A' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('Criança Teste')).toBeVisible();

  const medidas = await dialogo.evaluate((d) => {
    const r = d.getBoundingClientRect();
    const largura = document.documentElement.clientWidth;
    return {
      cabeNaLargura: r.left >= 0 && r.right <= largura + 1,
      rolagemInterna: d.scrollWidth > d.clientWidth,
      focoDentro: d.contains(document.activeElement),
      paginaRolaPorTras: getComputedStyle(document.body).overflow !== 'hidden'
        && getComputedStyle(document.documentElement).overflow !== 'hidden',
    };
  });
  const axe = await violacoesAxe(page, '[role="dialog"]');
  const pequenos = await textosPequenos(page);
  await fotografar(page, info, 'fluxo--modal-ficha', false);

  const fechar = dialogo.getByRole('button', { name: 'Fechar modal' });
  const tamanhoFechar = await fechar.boundingBox();
  await fechar.tap();
  await expect(dialogo).toBeHidden();
  const focoVoltou = await abrir.evaluate((b) => document.activeElement === b);

  gravarAchados(info, 'fluxo-modal', { medidas, axe, pequenos, tamanhoFechar, focoVoltou });
  expect.soft(medidas.cabeNaLargura).toBe(true);
  expect.soft(medidas.rolagemInterna, 'rolagem lateral dentro do modal').toBe(false);
  expect.soft(medidas.focoDentro).toBe(true);
  expect.soft(axe).toEqual([]);
  expect.soft(focoVoltou, 'foco volta ao nome da família').toBe(true);
});

/* ------------------------------------------------------------ lista longa */

const familiaFicticia = (i: number) => ({
  id: `fam-lista-${i}`, responsavelNome: `Responsável Fictícia de Nome Bem Comprido ${String(i).padStart(2, '0')}`,
  comunidadeId: 'com-1', comunidadeNome: 'Sítio Fictício do Riacho Comprido', municipioNome: 'Município Teste',
  ativa: i % 7 !== 0, semBanheiro: i % 3 === 0, totalPessoas: 3, totalAte12Anos: 1, totalDe13A59Anos: 2,
  total60AnosOuMais: 0, totalSemIdadeConhecida: 0,
});

for (const largura of [null, 320] as const) {
  test(`lista longa de famílias${largura ? ` em ${largura}px` : ''}: cartões ou rolagem só na tabela`, async ({ page }, info) => {
    await usarApiFalsa(page);
    await page.route((url) => url.pathname === '/api/familias', (rota) => rota.fulfill({
      json: { itens: Array.from({ length: 20 }, (_, i) => familiaFicticia(i + 1)), pagina: 0, porPagina: 20, total: 45, totalPaginas: 3 },
    }));
    if (largura) await page.setViewportSize({ width: largura, height: page.viewportSize()!.height });
    await page.goto('/familias');
    await expect(page.getByRole('button', { name: /Fictícia de Nome Bem Comprido 20$/ })).toBeVisible();

    const tabela = await page.locator('table').evaluate((t) => {
      const linha = t.querySelector('tbody tr')!;
      const caixaRolagem = t.parentElement!;
      const largura = document.documentElement.clientWidth;
      return {
        displayDaLinha: getComputedStyle(linha).display,
        cabecalhoVisivel: (t.querySelector('thead') as HTMLElement).getBoundingClientRect().height > 1,
        rolagemNaTabela: caixaRolagem.scrollWidth > caixaRolagem.clientWidth,
        cartaoCabe: linha.getBoundingClientRect().right <= largura + 1,
        alturaDoCartao: Math.round(linha.getBoundingClientRect().height),
      };
    });
    const rolagem = await rolagemHorizontal(page);
    const pequenos = await textosPequenos(page);
    const axe = await violacoesAxe(page);
    await fotografar(page, info, `fluxo--lista-longa${largura ? `--${largura}px` : ''}`);

    gravarAchados(info, `fluxo-lista${largura ? `-${largura}` : ''}`, { tabela, rolagem, pequenos, axe });
    const viraCartao = tabela.displayDaLinha !== 'table-row';
    expect.soft(viraCartao || tabela.rolagemNaTabela, 'vira cartão ou rola só na tabela').toBe(true);
    expect.soft(rolagem.temRolagem, 'página sem rolagem lateral').toBe(false);
    expect.soft(tabela.cartaoCabe).toBe(true);
    expect.soft(pequenos).toEqual([]);
    expect.soft(axe).toEqual([]);
  });
}

/* ------------------------------------------------------- teclado virtual */

/**
 * O Playwright não desenha teclado virtual. Aproximação: encolhe a altura da
 * tela pelo tamanho típico do teclado (Gboard no Pixel 7; teclado + barra de
 * sugestões no iPhone 13) e percorre os campos com Tab, como as setas
 * "anterior/próximo" do teclado. Em cada campo, mede quanto dele sobra à vista
 * (pontos testados com elementFromPoint, então barra fixa por cima conta).
 */
const TECLADO = { 'pixel-7': 330, 'iphone-13': 336 } as Record<string, number>;

for (const rota of ['/familias/nova', '/familias/fam-1/editar']) {
  test(`teclado virtual em ${rota}: campo focado não fica escondido`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await usarApiFalsa(page);
    const { width, height } = page.viewportSize()!;
    await page.setViewportSize({ width, height: height - (TECLADO[info.project.name] ?? 320) });
    await page.goto(rota);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.locator('main').evaluate((m) => (m as HTMLElement).focus());
    await page.getByLabel('Comunidade', { exact: true }).focus();

    const vistos = new Set<string>();
    const medicoes: { campo: string; visivel: number; foraDaTela: number; coberto: number; cobertoPor: string | null }[] = [];
    let repetidos = 0;
    for (let i = 0; i < 160; i += 1) {
      // Espera a rolagem do foco assentar antes de medir.
      await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
      await page.waitForTimeout(120);
      const m = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const campo = (el as HTMLInputElement).labels?.[0]?.innerText.trim() || el.getAttribute('aria-label')
          || el.innerText?.trim().slice(0, 30) || el.tagName;
        const chave = `${el.tagName}|${campo}|${Math.round(r.top + scrollY)}|${Math.round(r.left)}`;
        if (!document.querySelector('main')?.contains(el)) return { chave, foraDoMain: true as const };
        let total = 0, vistos = 0, fora = 0;
        const cobridores = new Map<string, number>();
        for (let fx = 0.1; fx < 1; fx += 0.2) {
          for (let fy = 0.1; fy < 1; fy += 0.2) {
            total += 1;
            const x = r.left + r.width * fx, y = r.top + r.height * fy;
            if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { fora += 1; continue; }
            const topo = document.elementFromPoint(x, y);
            const rotulo = (el as HTMLInputElement).labels?.[0];
            // A pílula de desenvolvimento do Next não existe em produção.
            if (topo && (el.contains(topo) || topo === rotulo || rotulo?.contains(topo) || topo.closest('nextjs-portal'))) vistos += 1;
            else if (topo) {
              const c = typeof topo.className === 'string' ? topo.className.split(' ')[0] : '';
              const k = `${topo.tagName.toLowerCase()}${c ? `.${c}` : ''}`;
              cobridores.set(k, (cobridores.get(k) ?? 0) + 1);
            }
          }
        }
        const pct = (n: number) => Math.round((n / total) * 100);
        return {
          chave, foraDoMain: false as const, campo, visivel: pct(vistos), foraDaTela: pct(fora),
          coberto: pct(total - vistos - fora), cobertoPor: [...cobridores.keys()][0] ?? null,
        };
      });
      if (!m) break;
      // Campo de data no Chrome: o Tab anda por dia/mês/ano sem trocar de campo.
      if (vistos.has(m.chave)) {
        if ((repetidos += 1) > 4) break;
        await page.keyboard.press('Tab');
        continue;
      }
      repetidos = 0;
      vistos.add(m.chave);
      if (!m.foraDoMain) {
        const { chave: _c, foraDoMain: _f, ...medida } = m;
        medicoes.push(medida);
        if (m.visivel < 100 && medicoes.filter((x) => x.visivel < 100).length === 1) {
          await fotografar(page, info, `fluxo--teclado-${rota === '/familias/nova' ? 'nova' : 'editar'}`, false);
        }
      }
      await page.keyboard.press('Tab');
    }

    const escondidos = medicoes.filter((x) => x.visivel === 0);
    const cobertos = medicoes.filter((x) => x.coberto > 0);
    const parciais = medicoes.filter((x) => x.visivel > 0 && x.visivel < 100);
    gravarAchados(info, `fluxo-teclado-${rota === '/familias/nova' ? 'nova' : 'editar'}`, {
      alturaUtil: page.viewportSize()!.height, camposPercorridos: medicoes.length, escondidos, parciais, cobertos,
      campos: medicoes.map((x) => x.campo),
    });
    expect(medicoes.length).toBeGreaterThan(5);
    expect.soft(cobertos, 'campo focado coberto por elemento da página').toEqual([]);
    expect.soft(escondidos, 'campo focado totalmente escondido (2.4.11)').toEqual([]);
  });
}
