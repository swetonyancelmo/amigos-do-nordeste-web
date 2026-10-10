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
  // Rótulos de propósito diferentes dos da API real: o front tem que mostrar
  // o que vier, nunca um texto próprio.
  estratoVulnerabilidade: opcoes(
    ['R3', 'Rótulo Falso R3'], ['R2', 'Rótulo Falso R2'], ['R1', 'Rótulo Falso R1'],
    ['DADOS_INSUFICIENTES', 'Rótulo Falso Completar'], ['SEM_RISCO_IDENTIFICADO', 'Rótulo Falso Sem Prioridade'],
  ),
};

/* Avaliação de vulnerabilidade (ADR-0010 da API), no formato do Swagger. */
const item = (codigo: string, nome: string, constatacao: string, pontos: number | null, pontosMaximos: number,
  detalhe: string, camposFaltantes: string[] = []) => ({ codigo, nome, constatacao, pontos, pontosMaximos, detalhe, camposFaltantes });

export const AVALIACAO_R3 = {
  estrato: 'R3', rotulo: 'Rótulo Falso R3', escore: 9, pontosConfirmados: 9, pontosEmAberto: 0, escoreMaximoAlcancavel: 10,
  sentinelasPresentes: [
    item('BAIXAS_CONDICOES_SANEAMENTO', 'Baixas condições de saneamento', 'PRESENTE', 3, 3, 'sem banheiro; escoamento: Céu aberto'),
    item('DESEMPREGO', 'Desemprego', 'PRESENTE', 2, 2, 'nenhuma renda de trabalho e 1 pessoa de 18 a 59 anos'),
    item('RELACAO_MORADOR_COMODO', 'Relação morador/cômodo', 'PRESENTE', 3, 3, '3 moradores em 2 cômodos (relação maior que 1)'),
    item('MAIOR_DE_70_ANOS', 'Maior de 70 anos', 'PRESENTE', 1, 1, '1 pessoa com 70 anos ou mais'),
  ],
  sentinelasAusentes: [item('MENOR_DE_SEIS_MESES', 'Menor de seis meses', 'AUSENTE', 0, 1, 'ninguém com menos de 6 meses')],
  sentinelasIndeterminadas: [],
  camposFaltantes: [],
};

export const AVALIACAO_A_COMPLETAR = {
  estrato: 'DADOS_INSUFICIENTES', rotulo: 'Rótulo Falso Completar', escore: null, pontosConfirmados: 2, pontosEmAberto: 7,
  escoreMaximoAlcancavel: 10,
  sentinelasPresentes: [item('DESEMPREGO', 'Desemprego', 'PRESENTE', 2, 2, 'sem renda fixa e 1 pessoa de 18 a 59 anos')],
  sentinelasAusentes: [],
  sentinelasIndeterminadas: [
    item('BAIXAS_CONDICOES_SANEAMENTO', 'Baixas condições de saneamento', 'INDETERMINADA', null, 3,
      'nenhum componente informado é precário, mas faltam dados de moradia', ['temBanheiro']),
    item('RELACAO_MORADOR_COMODO', 'Relação morador/cômodo', 'INDETERMINADA', null, 3,
      'número de cômodos ou de moradores não informado', ['numeroComodos']),
    item('MENOR_DE_SEIS_MESES', 'Menor de seis meses', 'INDETERMINADA', null, 1,
      '1 pessoa sem data de nascimento', ['pessoas.dataNascimento']),
  ],
  camposFaltantes: ['temBanheiro', 'numeroComodos', 'pessoas.dataNascimento'],
};

const resumoDe = (a: typeof AVALIACAO_R3 | typeof AVALIACAO_A_COMPLETAR) => ({
  estrato: a.estrato, rotulo: a.rotulo, escore: a.escore, pontosConfirmados: a.pontosConfirmados,
});

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
    vulnerabilidade: resumoDe(AVALIACAO_R3),
  },
  {
    id: 'fam-2', responsavelNome: 'Responsável Fictícia B', comunidadeId: 'com-2',
    comunidadeNome: 'Povoado Exemplo', municipioNome: 'Município Teste', ativa: true, semBanheiro: false,
    totalPessoas: 2, totalAte12Anos: 0, totalDe13A59Anos: 1, total60AnosOuMais: 1, totalSemIdadeConhecida: 0,
    vulnerabilidade: resumoDe(AVALIACAO_A_COMPLETAR),
  },
];

/** Ficha completa de `fam-1` (`GET /api/familias/fam-1`), com tudo o que a edição preenche. */
export const FICHA_FAM_1 = {
  id: 'fam-1', responsavelNome: 'Responsável Fictícia A', responsavelCpf: null, telefone: '(87) 90000-0000',
  pontoReferencia: 'Depois da cisterna fictícia', temBanheiro: false, escoamentoSanitario: 'CEU_ABERTO',
  tratamentoAgua: 'FERVIDA', abastecimentoAgua: ['CISTERNA'], faixaRenda: 'ATE_1_SALARIO',
  observacoes: null, ativa: true, comunidade: COMUNIDADES[0], numeroComodos: 2, vulnerabilidade: AVALIACAO_R3,
  criadoEm: '2026-09-01T10:00:00Z', atualizadoEm: '2026-09-01T10:00:00Z',
  pessoas: [
    {
      id: 'pes-1', nome: 'Responsável Fictícia A', cadastroIncompleto: false, sexo: 'FEMININO',
      dataNascimento: '1992-01-01', idadeEstimada: null, idadeEstimadaEm: null, idade: 34,
      parentesco: 'RESPONSAVEL', estuda: false, serie: null, tamanhoRoupa: 'ADULTO_M',
      numeroCalcado: '38', gestante: false, observacoes: null,
    },
    {
      id: 'pes-2', nome: 'Criança Teste', cadastroIncompleto: false, sexo: 'MASCULINO',
      dataNascimento: null, idadeEstimada: 6, idadeEstimadaEm: '2025-09-01', idade: 7,
      parentesco: 'FILHO', estuda: true, serie: 'ANO_1', tamanhoRoupa: 'INFANTIL_4',
      numeroCalcado: '30', gestante: null, observacoes: 'Observação fictícia',
    },
  ],
  fontesRenda: [{ id: 'ren-1', tipo: 'BOLSA_FAMILIA', pessoaId: 'pes-1', observacao: null }],
  totais: {
    totalPessoas: 2, totalAte12Anos: 1, totalDe13A59Anos: 1, total60AnosOuMais: 0,
    totalSemIdadeConhecida: 0, totalPessoasEstudando: 1, totalFontesRenda: 1,
  },
};

/** Ficha de `fam-2`: importada de lista antiga, quase sem dado (DADOS_INSUFICIENTES). */
const FICHA_FAM_2 = {
  id: 'fam-2', responsavelNome: 'Responsável Fictícia B', responsavelCpf: null, telefone: null,
  pontoReferencia: null, temBanheiro: null, escoamentoSanitario: null, tratamentoAgua: null, abastecimentoAgua: [],
  faixaRenda: 'SEM_RENDA_FIXA', observacoes: null, ativa: true, comunidade: COMUNIDADES[1], numeroComodos: null,
  vulnerabilidade: AVALIACAO_A_COMPLETAR, criadoEm: '2026-09-01T10:00:00Z', atualizadoEm: '2026-09-01T10:00:00Z',
  pessoas: [], fontesRenda: [],
  totais: {
    totalPessoas: 0, totalAte12Anos: 0, totalDe13A59Anos: 0, total60AnosOuMais: 0,
    totalSemIdadeConhecida: 0, totalPessoasEstudando: 0, totalFontesRenda: 0,
  },
};

const contagem = (r3: number, completar: number, total: number) =>
  METADADOS.estratoVulnerabilidade.map(({ valor, rotulo }) => {
    const n = valor === 'R3' ? r3 : valor === 'DADOS_INSUFICIENTES' ? completar : 0;
    return { estrato: valor, rotulo, valor: n, percentual: total ? (n * 100) / total : 0 };
  });

const RELATORIO_VULNERABILIDADE = {
  totalFamilias: 2,
  escoreMaximoAlcancavel: 10,
  distribuicao: contagem(1, 1, 2),
  porMunicipio: [{ municipioId: 'mun-1', municipioNome: 'Município Teste', totalFamilias: 2, distribuicao: contagem(1, 1, 2) }],
  porComunidade: [
    { comunidadeId: 'com-2', comunidadeNome: 'Povoado Exemplo', municipioNome: 'Município Teste', totalFamilias: 1, distribuicao: contagem(0, 1, 1) },
    { comunidadeId: 'com-1', comunidadeNome: 'Sítio Fictício', municipioNome: 'Município Teste', totalFamilias: 1, distribuicao: contagem(1, 0, 1) },
  ],
  camposFaltantes: [{ campo: 'numeroComodos', familias: 1 }, { campo: 'temBanheiro', familias: 1 }],
  sentinelasNaoAvaliadas: [
    { codigo: 'ANALFABETISMO', nome: 'Analfabetismo', pontos: 1, situacao: 'NAO_COLETADA', justificativa: 'Sem campo.' },
    { codigo: 'ACAMADO', nome: 'Acamado', pontos: 3, situacao: 'DESCARTADA_LGPD', justificativa: 'Dado de saúde.' },
  ],
};

/** `GET /api/vulnerabilidade/base`. Peso 4 no saneamento de propósito: a tela mostra o que a API manda. */
const BASE_VULNERABILIDADE = {
  escoreMaximoAlcancavel: 11,
  sentinelas: [
    { codigo: 'BAIXAS_CONDICOES_SANEAMENTO', nome: 'Baixas condições de saneamento', tipo: 'BINARIA', pontos: 4,
      faixas: [], criterio: 'Critério falso de saneamento.' },
    { codigo: 'RELACAO_MORADOR_COMODO', nome: 'Relação morador/cômodo', tipo: 'FAIXA', pontos: null,
      faixas: [{ operador: 'MAIOR', limite: 1, pontos: 3 }, { operador: 'IGUAL', limite: 1, pontos: 2 },
        { operador: 'MENOR', limite: 1, pontos: 0 }], criterio: 'Critério falso de cômodos.' },
  ],
  estratos: [
    { estrato: 'R3', rotulo: 'Rótulo Falso R3', descricaoInstrumento: 'R3 — risco máximo', escoreMinimo: 9, escoreMaximo: null, ordem: 1 },
    { estrato: 'R2', rotulo: 'Rótulo Falso R2', descricaoInstrumento: 'R2 — risco médio', escoreMinimo: 7, escoreMaximo: 8, ordem: 2 },
    { estrato: 'DADOS_INSUFICIENTES', rotulo: 'Rótulo Falso Completar', descricaoInstrumento: 'Fora do instrumento',
      escoreMinimo: null, escoreMaximo: null, ordem: 4 },
  ],
  sentinelasNaoAvaliadas: [
    { codigo: 'ACAMADO', nome: 'Acamado', pontos: 3, situacao: 'DESCARTADA_LGPD', justificativa: 'Justificativa falsa de saúde.' },
  ],
};

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

/** Resposta de cada rota, pelo caminho depois de `/api`; a query só filtra a lista de famílias. */
function responder(caminho: string, metodo: string, query: URLSearchParams = new URLSearchParams()): unknown {
  if (caminho === '/auth/renovar') return {
    accessToken: 'token-de-teste',
    usuario: { id: 'usuario-1', nome: 'Usuária de Teste', email: 'usuaria@teste.local' },
  };
  if (caminho === '/auth/sair') return {};
  if (caminho === '/metadados') return METADADOS;
  if (caminho === '/municipios') return [MUNICIPIO];
  if (caminho === '/comunidades') return COMUNIDADES;
  if (caminho === '/familias' && metodo === 'GET') {
    // Só os filtros que a Priorização e os testes de estrato usam.
    const estratos = query.getAll('estrato');
    const comunidadeId = query.get('comunidadeId');
    return pagina(FAMILIAS.filter((f) =>
      (!comunidadeId || f.comunidadeId === comunidadeId)
      && (estratos.length === 0 || estratos.includes(f.vulnerabilidade.estrato))));
  }
  if (caminho === '/familias/fam-1' && metodo === 'GET') return FICHA_FAM_1;
  if (caminho === '/familias/fam-2' && metodo === 'GET') return FICHA_FAM_2;
  if (caminho === '/relatorios/vulnerabilidade') return RELATORIO_VULNERABILIDADE;
  if (caminho === '/vulnerabilidade/base') return BASE_VULNERABILIDADE;
  // Qualquer outro id de família cai no 404 do fim, como a API faz.
  if (caminho === '/familias/fam-1' && metodo === 'PUT') {
    return { ...FICHA_FAM_1, comunidadeId: 'com-1', totais: { totalPessoas: 2, totalPessoasEstudando: 1, totalFontesRenda: 1 } };
  }
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
    // Formato da API (`PontosPorComunidadeResponse`): a lista antiga de
    // comunidades quebrava o Início inteiro ("comunidadesMapa is not iterable").
    return {
      municipio: null,
      pontos: [{ comunidadeId: 'com-1', nome: 'Sítio Fictício', latitude: -8.6, longitude: -37.7, familias: 2 }],
    };
  }
  return null;
}

/** Liga a API falsa e corta a internet de fora (mapas, IBGE): o teste roda offline. */
export async function usarApiFalsa(page: Page) {
  await page.route(/^https?:\/\/(?!localhost)/, (rota) => rota.abort());
  await page.route('**/api/**', async (rota: Route) => {
    const url = new URL(rota.request().url());
    const caminho = url.pathname.replace(/^\/api/, '');
    const corpo = responder(caminho, rota.request().method(), url.searchParams);
    if (corpo === null) {
      await rota.fulfill({ status: 404, json: { message: `Rota sem resposta falsa: ${caminho}` } });
      return;
    }
    await rota.fulfill({ status: 200, json: corpo });
  });
}
