/**
 * Apoio à tela da avaliação de vulnerabilidade (ADR-0010 da API).
 *
 * O que NÃO mora aqui, de propósito:
 *  - nenhum cálculo de escore ou estrato: a regra vive na API, em dado
 *    configurável, e uma cópia aqui divergiria no primeiro ajuste de peso;
 *  - nenhum rótulo de estrato: o texto vem da API (`rotulo`), configurável
 *    pela associação.
 *
 * O que mora: o nome, em português de formulário, de cada campo da família
 * que a API diz faltar (ela devolve o nome técnico, "numeroComodos"), e a
 * referência do instrumento.
 */

/** Código do estrato sem posição na escala: pede completar o cadastro. */
export const DADOS_INSUFICIENTES = 'DADOS_INSUFICIENTES';

/** Código do estrato abaixo do primeiro corte. */
export const SEM_RISCO_IDENTIFICADO = 'SEM_RISCO_IDENTIFICADO';

/** O instrumento, como deve aparecer junto de toda classificação. */
export const REFERENCIA_INSTRUMENTO =
  'Escala de Risco Familiar de Coelho-Savassi (Coelho e Savassi, Revista Brasileira de Medicina de '
  + 'Família e Comunidade, v. 1, n. 2, 2004), adaptada ao cadastro da associação.';

/** Endereço permanente do artigo (DOI). */
export const DOI_INSTRUMENTO = 'https://doi.org/10.5712/rbmfc1(2)104';

/** Âncora da explicação "como a prioridade é calculada", na tela de Priorização. */
export const ANCORA_COMO_CALCULA = 'como-a-prioridade-e-calculada';

/** A frase que acompanha toda classificação, visível, nunca em tooltip. */
export const FRASE_SUGESTAO =
  'Esta classificação é uma sugestão de prioridade, não uma decisão. Quem decide é você, com o que sabe da família.';

/**
 * Nome dos campos que a API devolve em `camposFaltantes`, no vocabulário do
 * formulário de família. Campo que não estiver aqui aparece com o nome que
 * veio, em vez de sumir.
 */
const CAMPOS: Record<string, string> = {
  temBanheiro: 'Se a casa tem banheiro',
  escoamentoSanitario: 'Escoamento do banheiro',
  tratamentoAgua: 'Tratamento da água de beber',
  abastecimentoAgua: 'De onde vem a água',
  faixaRenda: 'Quanto entra por mês, somando tudo',
  fontesRenda: 'De onde vem a renda',
  pessoas: 'Pessoas da família',
  'pessoas.idade': 'Idade de todas as pessoas',
  'pessoas.dataNascimento': 'Data de nascimento das pessoas (só ela mostra se há bebê com menos de 6 meses)',
  numeroComodos: 'Número de cômodos da casa',
};

/*
 * TEMPORÁRIO: o formulário de família ainda não tem o campo "número de
 * cômodos" (a API aceita desde a V17, o web não). Enquanto isso, a tela avisa
 * que esse campo não se completa pelo painel, em vez de mandar a usuária
 * para um formulário onde ele não existe. Tire daqui quando o campo entrar no
 * formulário.
 */
const CAMPOS_FORA_DO_FORMULARIO = new Set(['numeroComodos']);

export function nomeDoCampo(campo: string): string {
  return CAMPOS[campo] ?? campo;
}

export function campoForaDoFormulario(campo: string): boolean {
  return CAMPOS_FORA_DO_FORMULARIO.has(campo);
}
