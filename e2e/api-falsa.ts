import type { Page, Route } from '@playwright/test';

/**
 * API de mentira para os testes de acessibilidade. Intercepta `/api/*` no
 * navegador, então nem o Next nem a API de verdade são chamados.
 *
 * Todos os nomes aqui são inventados ("Fictícia", "Teste"): nada de dado real
 * de família em teste (CLAUDE.md, regra 10).
 */

const opcoes = (...pares: [string, string][]) => pares.map(([valor, rotulo]) => ({ valor, rotulo }));

const METADADOS = {
  tipoComunidade: opcoes(['SITIO', 'Sítio'], ['POVOADO', 'Povoado']),
  sexo: opcoes(['FEMININO', 'Feminino'], ['MASCULINO', 'Masculino']),
  parentesco: opcoes(['RESPONSAVEL', 'Responsável'], ['FILHO', 'Filho(a)']),
  abastecimentoAgua: opcoes(['CISTERNA', 'Cisterna'], ['CARRO_PIPA', 'Carro-pipa']),
  escoamentoSanitario: opcoes(['FOSSA_SEPTICA', 'Fossa séptica'], ['CEU_ABERTO', 'Céu aberto']),
  tratamentoAgua: opcoes(['SEM_TRATAMENTO', 'Sem tratamento'], ['FERVIDA', 'Fervida']),
  tipoFonteRenda: opcoes(['BOLSA_FAMILIA', 'Bolsa Família'], ['APOSENTADORIA', 'Aposentadoria']),
  faixaRenda: opcoes(['SEM_RENDA_FIXA', 'Sem renda fixa'], ['ATE_1_SALARIO', 'Até 1 salário']),
  serie: opcoes(['PRE', 'Pré-escola'], ['ANO_1', '1º ano']),
  tamanhoRoupa: opcoes(['INFANTIL_4', 'Infantil 4'], ['ADULTO_M', 'Adulto M']),
  numeroCalcado: opcoes(['30', '30'], ['38', '38']),
  situacaoPreCadastro: opcoes(['PENDENTE', 'Pendente'], ['APROVADO', 'Aprovado'], ['DEVOLVIDO', 'Devolvido']),
};

const MUNICIPIO = { id: 'mun-1', nome: 'Município Teste', uf: 'PE', codigoIbge: null };

const COMUNIDADES = [
  {
    id: 'com-1', nome: 'Sítio Fictício', municipioId: 'mun-1', municipioNome: 'Município Teste',
    tipoComunidade: 'SITIO', liderNome: null, liderTelefone: null,
    latitude: -8.6, longitude: -37.7, observacoes: null,
  },
  {
    id: 'com-2', nome: 'Povoado Exemplo', municipioId: 'mun-1', municipioNome: 'Município Teste',
    tipoComunidade: 'POVOADO', liderNome: null, liderTelefone: null,
    latitude: null, longitude: null, observacoes: null,
  },
];

const FAMILIAS = [
  {
    id: 'fam-1', responsavelNome: 'Responsável Fictícia A', comunidadeId: 'com-1',
    comunidadeNome: 'Sítio Fictício', municipioNome: 'Município Teste', ativa: true, semBanheiro: true,
    totalPessoas: 3, totalAte12Anos: 1, totalDe13A59Anos: 2, total60AnosOuMais: 0, totalSemIdadeConhecida: 0,
  },
  {
    id: 'fam-2', responsavelNome: 'Responsável Fictícia B', comunidadeId: 'com-2',
    comunidadeNome: 'Povoado Exemplo', municipioNome: 'Município Teste', ativa: true, semBanheiro: false,
    totalPessoas: 2, totalAte12Anos: 0, totalDe13A59Anos: 1, total60AnosOuMais: 1, totalSemIdadeConhecida: 0,
  },
];

const PESSOAS = [
  {
    id: 'pes-1', nome: 'Pessoa Teste Um', cadastroIncompleto: false, idade: 34, idadeEstimada: false,
    dataNascimento: '1992-01-01', familia: { id: 'fam-1', responsavelNome: 'Responsável Fictícia A' },
    comunidade: { id: 'com-1', nome: 'Sítio Fictício' }, municipio: { id: 'mun-1', nome: 'Município Teste' },
    estuda: false,
  },
];

const pagina = <T>(itens: T[]) => ({ itens, pagina: 0, porPagina: 20, total: itens.length, totalPaginas: 1 });

const indicador = (valor: number) => ({ valor, percentual: valor * 10 });

/** Resposta de cada rota, pelo caminho depois de `/api` (sem a query). */
function responder(caminho: string, metodo: string): unknown {
  if (caminho === '/auth/renovar') return { accessToken: 'token-de-teste' };
  if (caminho === '/auth/sair') return {};
  if (caminho === '/metadados') return METADADOS;
  if (caminho === '/municipios') return [MUNICIPIO];
  if (caminho === '/comunidades') return COMUNIDADES;
  if (caminho === '/familias' && metodo === 'GET') return pagina(FAMILIAS);
  if (caminho === '/pessoas') return pagina(PESSOAS);
  if (caminho === '/agentes') {
    return [
      { id: 'ag-1', nome: 'Agente Teste', ativo: true, codigoConvite: null, ativadoEm: '2026-09-01T10:00:00Z' },
      { id: 'ag-2', nome: 'Agente Fictícia Dois', ativo: true, codigoConvite: '123456', ativadoEm: null },
    ];
  }
  if (caminho === '/pre-cadastros') {
    return [{
      id: 'pre-1', responsavelNome: 'Responsável Fictícia C', comunidadeId: 'com-1',
      comunidadeNome: 'Sítio Fictício', totalPessoas: 2, agenteNome: 'Agente Teste',
      recebidoEm: '2026-10-01T12:00:00Z', situacao: 'PENDENTE', possivelDuplicata: null,
    }, {
      id: 'pre-2', responsavelNome: 'Responsável Fictícia E', comunidadeId: 'com-2',
      comunidadeNome: 'Povoado Exemplo', totalPessoas: 1, agenteNome: 'Agente Teste',
      recebidoEm: '2026-09-28T12:00:00Z', situacao: 'APROVADO', possivelDuplicata: null,
    }];
  }
  if (caminho === '/pre-cadastros/pre-1') {
    return {
      id: 'pre-1', situacao: 'PENDENTE', agenteNome: 'Agente Teste', recebidoEm: '2026-10-01T12:00:00Z',
      avaliadoEm: null, criadoEm: '2026-10-01T11:50:00Z', motivoDevolucao: null, familiaId: null,
      responsavelNome: 'Responsável Fictícia C', telefone: null, pontoReferencia: 'Perto da cisterna',
      comunidadeId: 'com-1', comunidadeNome: 'Sítio Fictício', possivelDuplicata: null,
      pessoas: [{
        indice: 0, nome: 'Responsável Fictícia C', cadastroIncompleto: false, sexo: 'FEMININO',
        dataNascimento: null, idadeEstimada: 40, idadeEstimadaEm: '2026-10-01', idade: 40,
      }],
    };
  }
  if (caminho === '/relatorios/situacao') {
    return {
      totalFamilias: 2, semBanheiro: indicador(1), soCarroPipa: indicador(0),
      soBolsaFamilia: indicador(1), semTratamentoAgua: indicador(1),
    };
  }
  if (caminho === '/relatorios/necessidades') {
    return {
      totalFamilias: 2, totalPessoas: 5, totalCriancasAte12: 1,
      roupa: [{ chave: 'INFANTIL_4', quantidade: 1 }], calcado: [{ chave: '30', quantidade: 1 }],
      semTamanhoInformado: 0, semCalcadoInformado: 0, semIdadeInformada: 0,
    };
  }
  if (caminho === '/relatorios/mapa') {
    return [{ id: 'com-1', nome: 'Sítio Fictício', municipioId: 'mun-1', totalFamilias: 2, latitude: -8.6, longitude: -37.7 }];
  }
  return null;
}

/** Liga a API falsa e corta a internet de fora (mapas, IBGE): o teste roda offline. */
export async function usarApiFalsa(page: Page) {
  await page.route(/^https?:\/\/(?!localhost)/, (rota) => rota.abort());
  await page.route('**/api/**', async (rota: Route) => {
    const url = new URL(rota.request().url());
    const caminho = url.pathname.replace(/^\/api/, '');
    const corpo = responder(caminho, rota.request().method());
    if (corpo === null) {
      await rota.fulfill({ status: 404, json: { message: `Rota sem resposta falsa: ${caminho}` } });
      return;
    }
    await rota.fulfill({ status: 200, json: corpo });
  });
}
