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
 * Estes tipos são um espelho dos enums em `dominio/` no backend (Java/Spring).
 * Se um deles mudar lá, ajuste aqui — não existe compilador cruzando os dois
 * repositórios para avisar por você.
 */

export type TipoComunidade = 'SITIO' | 'ASSENTAMENTO' | 'DISTRITO' | 'POVOADO' | 'BAIRRO';
export type Sexo = 'F' | 'M';

export type AbastecimentoAgua =
  | 'REDE_ENCANADA' | 'POCO_OU_NASCENTE' | 'CISTERNA' | 'CARRO_PIPA' | 'OUTRO';

export type EscoamentoSanitario =
  | 'REDE_COLETORA' | 'FOSSA_SEPTICA' | 'FOSSA_RUDIMENTAR'
  | 'DIRETO_RIO_LAGO' | 'CEU_ABERTO' | 'OUTRA';

export type TratamentoAgua = 'FILTRADA' | 'FERVIDA' | 'CLORADA' | 'MINERAL' | 'SEM_TRATAMENTO';

export type TipoFonteRenda =
  | 'BOLSA_FAMILIA' | 'APOSENTADORIA' | 'BPC' | 'TRABALHO_SAZONAL'
  | 'TRABALHO_FIXO' | 'PENSAO' | 'NENHUMA' | 'OUTRA';

export type FaixaRenda = 'SEM_RENDA_FIXA' | 'ATE_1_SM' | 'DE_1_A_2_SM' | 'MAIS_DE_2_SM';
export type TamanhoRoupa = 'PP' | 'P' | 'M' | 'G' | 'GG';
export type FaixaEtaria = 'ATE_12' | 'DE_13_A_59' | 'DE_60_OU_MAIS';

/** Espelha o que `FamiliasService.totaisDe` calcula no backend. */
export interface TotaisFamilia {
  totalPessoas: number;
  ate12: number;
  de13a59: number;
  de60ouMais: number;
  semIdadeInformada: number;
}

export interface Pessoa {
  id: string;
  nome: string;
  cadastroIncompleto: boolean;
  sexo: Sexo;
  dataNascimento: string | null;
  idadeEstimada: number | null;
  idadeEstimadaEm: string | null;
  parentesco: string | null;
  estuda: boolean;
  serie: string | null;
  tamanhoRoupa: TamanhoRoupa | null;
  numeroCalcado: string | null;
  gestante: boolean;
}

export interface FonteRenda {
  id: string;
  tipo: TipoFonteRenda;
  pessoaId: string | null;
  faixa: FaixaRenda | null;
  observacao: string | null;
}

export interface Familia {
  id: string;
  comunidadeId: string;
  responsavelNome: string;
  responsavelCpf: string | null;
  telefone: string | null;
  pontoReferencia: string | null;
  abastecimentoAgua: AbastecimentoAgua[];
  temBanheiro: boolean | null;
  escoamentoSanitario: EscoamentoSanitario | null;
  tratamentoAgua: TratamentoAgua | null;
  pessoas?: Pessoa[];
  fontesRenda?: FonteRenda[];
  totais?: TotaisFamilia;
}

/** Um ponto do mapa. É por comunidade, nunca por família — ver ADR-0005. */
export interface PontoMapa {
  comunidadeId: string;
  comunidade: string;
  municipio: string;
  codigoIbge: string | null;
  latitude: string | null;
  longitude: string | null;
  familias: number;
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

/** O formato de `GET /api/metadados`. */
export interface Metadados {
  tipoComunidade: Opcao[];
  sexo: Opcao[];
  abastecimentoAgua: Opcao[];
  escoamentoSanitario: Opcao[];
  tratamentoAgua: Opcao[];
  tipoFonteRenda: Opcao[];
  faixaRenda: Opcao[];
  serie: Opcao[];
  tamanhoRoupa: Opcao[];
  numeroCalcado: Opcao[];
}
