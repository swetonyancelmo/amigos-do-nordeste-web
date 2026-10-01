/**
 * Declarações de tipo do domínio.
 *
 * ATENÇÃO: aqui existem apenas TIPOS, nunca valores nem rótulos.
 *
 * A fonte da verdade das listas é a API, em `GET /api/metadados`, que devolve
 * cada opção já com o rótulo em português. Use `useMetadados()` para montar os
 * <select> — não escreva arrays de opção neste repositório.
 *
 * Motivo: backend e frontend vivem em repositórios separados. Uma lista copiada
 * nos dois lados vira uma lista divergente em duas semanas, e o erro só aparece
 * quando a associação abre a tela. Ver ADR-0006 no repositório da API.
 *
 * Estes tipos são um espelho dos enums e records Java da API
 * (`cadastro-familias-api/src/main/java/.../enums/` e os `*Response`/`*Resposta`).
 * Se um deles mudar lá, ajuste aqui — não existe compilador cruzando os dois
 * repositórios para avisar por você. Datas vêm como `AAAA-MM-DD`; data e hora,
 * em ISO com fuso; ids, UUID em texto.
 */

/* ------------------------------------------------------------ listas fechadas */

export type TipoComunidade =
  | 'SITIO' | 'ASSENTAMENTO' | 'POVOADO' | 'COMUNIDADE_QUILOMBOLA'
  | 'VILA' | 'DISTRITO' | 'BAIRRO' | 'OUTRO';

export type Sexo = 'FEMININO' | 'MASCULINO';

export type Parentesco =
  | 'RESPONSAVEL' | 'CONJUGE' | 'FILHO' | 'ENTEADO' | 'PAI_OU_MAE' | 'SOGRO'
  | 'GENRO_OU_NORA' | 'NETO' | 'AVO' | 'IRMAO' | 'OUTRO_PARENTE' | 'AGREGADO'
  | 'SEM_PARENTESCO';

export type AbastecimentoAgua =
  | 'REDE_PUBLICA' | 'POCO_NASCENTE_NO_DOMICILIO' | 'CISTERNA' | 'CARRO_PIPA'
  | 'CAPTACAO_DIRETA_RIO' | 'POCO_COLETIVO' | 'CHAFARIZ' | 'OUTRO';

export type EscoamentoSanitario =
  | 'FOSSA_RUDIMENTAR' | 'FOSSA_SEPTICA' | 'REDE_COLETORA' | 'CEU_ABERTO'
  | 'DIRETO_RIO_LAGO_MAR' | 'OUTRA_FORMA';

export type TratamentoAgua =
  | 'SEM_TRATAMENTO' | 'FILTRADA_FILTRO_BARRO' | 'FILTRADA_OUTRO_FILTRO'
  | 'CLORADA' | 'CLORADA_HIPOCLORITO' | 'FERVIDA' | 'MINERAL';

export type TipoFonteRenda =
  | 'BOLSA_FAMILIA' | 'APOSENTADORIA' | 'BPC' | 'TRABALHO_SAZONAL'
  | 'TRABALHO_FIXO' | 'TRABALHO_INFORMAL' | 'AUXILIO_DOENCA'
  | 'PENSAO' | 'NENHUMA' | 'OUTRA';

export type FaixaRenda =
  | 'SEM_RENDA_FIXA' | 'ATE_1_SALARIO' | 'DE_1_A_2_SALARIOS' | 'MAIS_DE_2_SALARIOS';

export type Serie =
  | 'PRE' | 'ANO_1' | 'ANO_2' | 'ANO_3' | 'ANO_4' | 'ANO_5' | 'ANO_6'
  | 'ANO_7' | 'ANO_8' | 'ANO_9' | 'ENSINO_MEDIO' | 'NAO_SE_APLICA';

export type TamanhoRoupa =
  | 'RN' | 'BEBE_P' | 'BEBE_M' | 'BEBE_G'
  | 'INFANTIL_2' | 'INFANTIL_4' | 'INFANTIL_6' | 'INFANTIL_8'
  | 'INFANTIL_10' | 'INFANTIL_12' | 'INFANTIL_14'
  | 'ADULTO_PP' | 'ADULTO_P' | 'ADULTO_M' | 'ADULTO_G'
  | 'ADULTO_GG' | 'ADULTO_XG' | 'ADULTO_XGG';

export type FaixaEtaria = 'ATE_12' | 'DE_13_A_59' | 'DE_60_OU_MAIS';

/* ------------------------------------------------------------------ comuns */

/** `PaginaResposta` da API. A página começa em 0. */
export interface Pagina<T> {
  itens: T[];
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

/** O formato de `GET /api/metadados`. */
export interface Metadados {
  tipoComunidade: Opcao[];
  sexo: Opcao[];
  parentesco: Opcao[];
  abastecimentoAgua: Opcao[];
  escoamentoSanitario: Opcao[];
  tratamentoAgua: Opcao[];
  tipoFonteRenda: Opcao[];
  faixaRenda: Opcao[];
  serie: Opcao[];
  tamanhoRoupa: Opcao[];
  numeroCalcado: Opcao[];
}

/* ------------------------------------------------------- comunidade e município */

/** `ComunidadeResponse` — `GET /api/comunidades`. */
export interface Comunidade {
  id: string;
  nome: string;
  municipioId: string;
  municipioNome: string;
  tipoComunidade: TipoComunidade;
  liderNome: string | null;
  liderTelefone: string | null;
  latitude: number | null;
  longitude: number | null;
  observacoes: string | null;
}

/** `MunicipioResposta` — `GET /api/municipios`. */
export interface Municipio {
  id: string;
  nome: string;
  uf: string;
  codigoIbge: string | null;
}

/* ---------------------------------------------------------- família e pessoa */

/** `PessoaResponse`: a pessoa dentro da ficha da família. */
export interface Pessoa {
  id: string;
  /** Pode faltar em cadastro incompleto ("filha de Fulana"). */
  nome: string | null;
  cadastroIncompleto: boolean;
  sexo: Sexo | null;
  dataNascimento: string | null;
  idadeEstimada: number | null;
  idadeEstimadaEm: string | null;
  /** Calculada na hora pela API; null quando não há data nem estimativa. */
  idade: number | null;
  parentesco: Parentesco | null;
  /** null = não informado (não é o mesmo que "não estuda"). */
  estuda: boolean | null;
  serie: Serie | null;
  tamanhoRoupa: TamanhoRoupa | null;
  numeroCalcado: string | null;
  gestante: boolean | null;
  observacoes: string | null;
}

/** `FonteRendaResponse`. `pessoaId` null = renda da família (ex.: Bolsa Família). */
export interface FonteRenda {
  id: string;
  tipo: TipoFonteRenda;
  pessoaId: string | null;
  faixa: FaixaRenda | null;
  observacao: string | null;
}

/** Os totais da ficha (`FamiliaDetalheResponse.Totais`), contados na API. */
export interface TotaisFamiliaDetalhe {
  totalPessoas: number;
  totalAte12Anos: number;
  totalDe13A59Anos: number;
  total60AnosOuMais: number;
  totalSemIdadeConhecida: number;
  totalPessoasEstudando: number;
  totalFontesRenda: number;
}

/** Os totais da resposta de POST/PUT (`FamiliaResponse.Totais`). */
export interface TotaisFamiliaGravada {
  totalPessoas: number;
  totalPessoasEstudando: number;
  totalFontesRenda: number;
}

interface CamposFamilia {
  id: string;
  responsavelNome: string;
  responsavelCpf: string | null;
  telefone: string | null;
  pontoReferencia: string | null;
  temBanheiro: boolean | null;
  escoamentoSanitario: EscoamentoSanitario | null;
  tratamentoAgua: TratamentoAgua | null;
  abastecimentoAgua: AbastecimentoAgua[];
  pessoas: Pessoa[];
  fontesRenda: FonteRenda[];
  observacoes: string | null;
  ativa: boolean;
}

/** `FamiliaDetalheResponse` — `GET /api/familias/{id}` (a ficha completa). */
export interface FamiliaDetalhe extends CamposFamilia {
  comunidade: Comunidade;
  criadoEm: string;
  atualizadoEm: string;
  totais: TotaisFamiliaDetalhe;
}

/** `FamiliaResponse` — resposta de POST/PUT `/api/familias` e da aprovação de pré-cadastro. */
export interface FamiliaGravada extends CamposFamilia {
  comunidadeId: string;
  totais: TotaisFamiliaGravada;
}

/** `FamiliaResumoResponse` — uma linha de `GET /api/familias` (e a resposta de inativar/reativar). */
export interface FamiliaResumo {
  id: string;
  responsavelNome: string;
  comunidadeId: string;
  comunidadeNome: string;
  municipioNome: string;
  ativa: boolean;
  semBanheiro: boolean;
  totalPessoas: number;
  totalAte12Anos: number;
  totalDe13A59Anos: number;
  total60AnosOuMais: number;
  totalSemIdadeConhecida: number;
}

/* ------------------------------------------------------------ pré-cadastros */

export type SituacaoPreCadastro = 'PENDENTE' | 'APROVADO' | 'DEVOLVIDO';
export type MotivoDuplicata = 'TELEFONE_IGUAL' | 'NOME_PARECIDO';

/** Família já cadastrada que pode ser a mesma do chamado. Só aviso. */
export interface PossivelDuplicata {
  familiaId: string;
  nome: string;
  motivo: MotivoDuplicata;
}

/** `PreCadastroResumoResposta` — uma linha de `GET /api/pre-cadastros`. */
export interface PreCadastroResumo {
  id: string;
  responsavelNome: string | null;
  /** null quando o servidor não reconheceu a comunidade enviada. */
  comunidadeId: string | null;
  comunidadeNome: string | null;
  totalPessoas: number;
  agenteNome: string;
  recebidoEm: string;
  situacao: SituacaoPreCadastro;
  possivelDuplicata: PossivelDuplicata | null;
}

/** Pessoa como a agente coletou. `indice` é o que a aprovação usa em `pessoas[].indice`. */
export interface PessoaColetada {
  indice: number;
  nome: string | null;
  cadastroIncompleto: boolean;
  sexo: Sexo | null;
  dataNascimento: string | null;
  idadeEstimada: number | null;
  idadeEstimadaEm: string | null;
  idade: number | null;
}

/** `PreCadastroDetalheResposta` — `GET /api/pre-cadastros/{id}`. */
export interface PreCadastroDetalhe {
  id: string;
  situacao: SituacaoPreCadastro;
  agenteNome: string;
  recebidoEm: string;
  avaliadoEm: string | null;
  criadoEm: string;
  motivoDevolucao: string | null;
  familiaId: string | null;
  responsavelNome: string;
  telefone: string | null;
  pontoReferencia: string | null;
  comunidadeId: string | null;
  comunidadeNome: string | null;
  possivelDuplicata: PossivelDuplicata | null;
  pessoas: PessoaColetada[];
}

/** Complemento de uma pessoa na aprovação (`AprovarPreCadastroRequisicao.ComplementoPessoa`). */
export interface ComplementoPessoa {
  indice: number;
  parentesco: Parentesco | null;
  estuda: boolean | null;
  serie: Serie | null;
  tamanhoRoupa: TamanhoRoupa | null;
  numeroCalcado: string | null;
  gestante: boolean | null;
}

/** Fonte de renda na aprovação: `pessoaIndice` é a posição da pessoa no pré-cadastro. */
export interface FonteRendaNova {
  tipo: TipoFonteRenda;
  pessoaIndice: number | null;
  faixa: FaixaRenda | null;
  observacao: string | null;
}

/** Corpo de `POST /api/pre-cadastros/{id}/aprovar`. Tudo opcional. */
export interface AprovarPreCadastro {
  /** Só quando o servidor não reconheceu a comunidade; se vier, prevalece. */
  comunidadeId?: string | null;
  responsavelCpf?: string | null;
  temBanheiro?: boolean | null;
  escoamentoSanitario?: EscoamentoSanitario | null;
  tratamentoAgua?: TratamentoAgua | null;
  abastecimentoAgua?: AbastecimentoAgua[];
  fontesRenda?: FonteRendaNova[];
  pessoas?: ComplementoPessoa[];
  observacoes?: string | null;
}

/*
 * Mapa: a API ainda não tem a rota (o painel citava `GET /api/relatorios/mapa`,
 * que não existe). O tipo entra aqui quando ela for criada lá, com o formato
 * que o Swagger definir. Lembrete: um ponto por comunidade, nunca por família
 * (ADR-0005).
 */
