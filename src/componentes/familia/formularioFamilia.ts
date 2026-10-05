import type { ErroDeCampo } from '@/componentes/useErrosDeCampo';
import { hoje } from '@/lib/datas';
import type {
  AbastecimentoAgua, AtualizarFamiliaRequisicao, EscoamentoSanitario, FaixaRenda, FamiliaDetalhe, Opcao, Parentesco, Serie, Sexo,
  TamanhoRoupa, TipoFonteRenda, TratamentoAgua,
} from '@/tipos/dominio';

/** Campo booleano que pode ficar sem resposta: '' é "não informado", não "não". */
export type TresEstados = '' | 'true' | 'false';
export const SIM_NAO: Opcao[] = [
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
];
const paraBooleano = (v: TresEstados) => (v === '' ? null : v === 'true');
const ouNulo = <T extends string>(v: T | '') => (v === '' ? null : v);
const textoOuNulo = (v: string) => v.trim() || null;

/**
 * O que a pessoa já salva tinha e a tela não mostra (ou mostra de outro
 * jeito): volta como veio no PUT, para editar não apagar nem mudar nada sem
 * querer.
 */
type PessoaOriginal = {
  observacoes: string | null;
  /** Idade estimada como a API guarda: o número e o dia em que foi estimada. */
  idadeEstimada: number | null;
  idadeEstimadaEm: string | null;
  /** O que o campo "Idade estimada" mostrou ao abrir (a idade de hoje). */
  idadeExibida: string;
};

/**
 * `chave` só existe na tela: liga a fonte de renda à pessoa mesmo se a ordem
 * mudar. `id` e `original` só existem na edição, para pessoa já salva.
 */
export type FormPessoa = {
  chave: string;
  id?: string;
  original?: PessoaOriginal;
  nome: string;
  sexo: Sexo | '';
  dataNascimento: string;
  idadeEstimada: string;
  parentesco: Parentesco | '';
  estuda: TresEstados;
  serie: Serie | '';
  tamanhoRoupa: TamanhoRoupa | '';
  numeroCalcado: string;
  gestante: TresEstados;
};

/** De onde vem o dinheiro. Quanto entra é a faixa da família, não da fonte (ADR-0003). */
export type FormFonte = {
  chave: string;
  /** Só na edição, para fonte já salva. */
  id?: string;
  tipo: TipoFonteRenda | '';
  /** '' = renda da família; senão, a `chave` de quem recebe. */
  pessoa: string;
  observacao: string;
};

export type Formulario = {
  comunidadeId: string;
  responsavelNome: string;
  responsavelCpf: string;
  telefone: string;
  pontoReferencia: string;
  temBanheiro: TresEstados;
  escoamentoSanitario: EscoamentoSanitario | '';
  tratamentoAgua: TratamentoAgua | '';
  abastecimentoAgua: AbastecimentoAgua[];
  faixaRenda: FaixaRenda | '';
  observacoes: string;
  pessoas: FormPessoa[];
  fontes: FormFonte[];
};

let contador = 0;
export const novaChave = () => `linha-${++contador}`;

export const novaPessoa = (parentesco: Parentesco | '' = ''): FormPessoa => ({
  chave: novaChave(),
  nome: '',
  sexo: '',
  dataNascimento: '',
  idadeEstimada: '',
  parentesco,
  estuda: '',
  serie: '',
  tamanhoRoupa: '',
  numeroCalcado: '',
  gestante: '',
});

/** A primeira pessoa é a responsável: o nome dela acompanha o campo de cima. */
export const formularioVazio = (comunidadeId = ''): Formulario => ({
  comunidadeId,
  responsavelNome: '',
  responsavelCpf: '',
  telefone: '',
  pontoReferencia: '',
  temBanheiro: '',
  escoamentoSanitario: '',
  tratamentoAgua: '',
  abastecimentoAgua: [],
  faixaRenda: '',
  observacoes: '',
  pessoas: [novaPessoa('RESPONSAVEL')],
  fontes: [],
});

/** Linha que ninguém preencheu não vira pessoa: seria um cadastro incompleto vazio. */
export const pessoaEmBranco = (p: FormPessoa) =>
  !p.nome.trim() && !p.sexo && !p.dataNascimento && !p.idadeEstimada.trim() && !p.parentesco
  && !p.estuda && !p.tamanhoRoupa && !p.numeroCalcado && !p.gestante;

/** Só para o resumo da tela; quem conta de verdade é a API. */
export function idadeDe(p: FormPessoa): number | null {
  if (p.dataNascimento) {
    const [ano, mes, dia] = p.dataNascimento.split('-').map(Number);
    const [anoH, mesH, diaH] = hoje().split('-').map(Number);
    const idade = anoH - ano - (mesH < mes || (mesH === mes && diaH < dia) ? 1 : 0);
    return idade >= 0 ? idade : null;
  }
  const estimada = p.idadeEstimada.trim();
  return estimada ? Number(estimada) : null;
}

/** Os campos da pessoa iguais no POST e no PUT. */
function corpoPessoa(p: FormPessoa) {
  const nome = textoOuNulo(p.nome);
  // Data de nascimento e estimativa não vão juntas (a API recusa); a
  // estimativa leva a data em que foi feita, para o sistema envelhecê-la.
  const idadeEstimada = !p.dataNascimento && p.idadeEstimada.trim() ? Number(p.idadeEstimada) : null;
  return {
    nome,
    // Sem nome a API só aceita com cadastroIncompleto = true; com nome,
    // ela mesma decide (falta de idade também marca incompleto).
    cadastroIncompleto: nome === null,
    sexo: ouNulo(p.sexo),
    dataNascimento: p.dataNascimento || null,
    idadeEstimada,
    idadeEstimadaEm: idadeEstimada === null ? null : hoje(),
    parentesco: ouNulo(p.parentesco),
    estuda: paraBooleano(p.estuda),
    serie: p.estuda === 'true' ? ouNulo(p.serie) : null,
    tamanhoRoupa: ouNulo(p.tamanhoRoupa),
    numeroCalcado: p.numeroCalcado || null,
    gestante: p.sexo === 'MASCULINO' ? null : paraBooleano(p.gestante),
    observacoes: p.original?.observacoes ?? null,
  };
}

/** Os campos da família iguais no POST e no PUT. */
function corpoFamilia(form: Formulario) {
  return {
    comunidadeId: form.comunidadeId,
    responsavelNome: form.responsavelNome.trim(),
    responsavelCpf: textoOuNulo(form.responsavelCpf),
    telefone: textoOuNulo(form.telefone),
    pontoReferencia: textoOuNulo(form.pontoReferencia),
    temBanheiro: paraBooleano(form.temBanheiro),
    escoamentoSanitario: ouNulo(form.escoamentoSanitario),
    tratamentoAgua: ouNulo(form.tratamentoAgua),
    abastecimentoAgua: form.abastecimentoAgua,
    faixaRenda: ouNulo(form.faixaRenda),
    observacoes: textoOuNulo(form.observacoes),
  };
}

/**
 * Monta o `CriarFamiliaRequisicao`. A fonte de renda aponta para a pessoa pela
 * posição em `pessoas[]` (ela ainda não tem id), então o índice é calculado
 * aqui, depois de tirar as linhas em branco.
 */
export function montarCorpoCriacao(form: Formulario) {
  const pessoas = form.pessoas.filter((p) => !pessoaEmBranco(p));
  const indicePorChave = new Map(pessoas.map((p, i) => [p.chave, i]));

  return {
    ...corpoFamilia(form),
    pessoas: pessoas.map(corpoPessoa),
    fontesRenda: form.fontes.map((f) => ({
      tipo: f.tipo as TipoFonteRenda,
      pessoaIndice: indicePorChave.get(f.pessoa) ?? null,
      observacao: textoOuNulo(f.observacao),
    })),
  };
}

export const ID_RESPONSAVEL = 'nome-responsavel';
export const ID_COMUNIDADE = 'comunidade-familia';
export const idTipoFonte = (chave: string) => `tipo-fonte-${chave}`;

/** Valida tudo de uma vez, na ordem da tela; o primeiro da lista recebe o foco. */
export function validar(form: Formulario): ErroDeCampo[] {
  const erros: ErroDeCampo[] = [];
  if (!form.comunidadeId) {
    erros.push({ id: ID_COMUNIDADE, mensagem: 'Escolha a comunidade da família.' });
  }
  if (!form.responsavelNome.trim()) {
    erros.push({ id: ID_RESPONSAVEL, mensagem: 'Informe o nome da responsável.' });
  }
  form.fontes.forEach((f, i) => {
    if (f.tipo !== '') return;
    erros.push({
      id: idTipoFonte(f.chave),
      mensagem: 'Escolha o tipo desta fonte de renda, ou remova a linha.',
      resumo: `Fonte de renda ${i + 1}: escolha o tipo, ou remova a linha.`,
    });
  });
  return erros;
}

const paraTresEstados = (v: boolean | null): TresEstados => (v === null ? '' : v ? 'true' : 'false');

/**
 * A ficha da API (`GET /api/familias/{id}`) no formato da tela. A pessoa com
 * idade estimada aparece com a idade de hoje, não com a do dia da estimativa.
 */
export function formularioDaFicha(ficha: FamiliaDetalhe): Formulario {
  const pessoas: FormPessoa[] = ficha.pessoas.map((p) => {
    const idadeExibida = !p.dataNascimento && p.idade !== null ? String(p.idade) : '';
    return {
      chave: novaChave(),
      id: p.id,
      original: {
        observacoes: p.observacoes,
        idadeEstimada: p.idadeEstimada,
        idadeEstimadaEm: p.idadeEstimadaEm,
        idadeExibida,
      },
      nome: p.nome ?? '',
      sexo: p.sexo ?? '',
      dataNascimento: p.dataNascimento ?? '',
      idadeEstimada: idadeExibida,
      parentesco: p.parentesco ?? '',
      estuda: paraTresEstados(p.estuda),
      serie: p.serie ?? '',
      tamanhoRoupa: p.tamanhoRoupa ?? '',
      numeroCalcado: p.numeroCalcado ?? '',
      gestante: paraTresEstados(p.gestante),
    };
  });
  const chavePorId = new Map(pessoas.map((p) => [p.id, p.chave]));

  return {
    comunidadeId: ficha.comunidade.id,
    responsavelNome: ficha.responsavelNome,
    responsavelCpf: ficha.responsavelCpf ?? '',
    telefone: ficha.telefone ?? '',
    pontoReferencia: ficha.pontoReferencia ?? '',
    temBanheiro: paraTresEstados(ficha.temBanheiro),
    escoamentoSanitario: ficha.escoamentoSanitario ?? '',
    tratamentoAgua: ficha.tratamentoAgua ?? '',
    abastecimentoAgua: ficha.abastecimentoAgua,
    faixaRenda: ficha.faixaRenda ?? '',
    observacoes: ficha.observacoes ?? '',
    pessoas,
    fontes: ficha.fontesRenda.map((f) => ({
      chave: novaChave(),
      id: f.id,
      tipo: f.tipo,
      pessoa: (f.pessoaId && chavePorId.get(f.pessoaId)) || '',
      observacao: f.observacao ?? '',
    })),
  };
}

/**
 * Monta o `AtualizarFamiliaRequisicao` (`PUT /api/familias/{id}`). Para a API,
 * com id = atualiza, sem id = cria e quem some do array é removido. Por isso
 * pessoa já salva nunca cai no filtro de linha em branco: ela só sai pelo
 * botão Remover. A fonte aponta para a pessoa pelo id, que só a pessoa já
 * salva tem; pessoa nova ainda não pode receber renda (fica com a família).
 */
export function montarCorpoAtualizacao(form: Formulario): AtualizarFamiliaRequisicao {
  const pessoas = form.pessoas.filter((p) => p.id || !pessoaEmBranco(p));
  const idPorChave = new Map(pessoas.filter((p) => p.id).map((p) => [p.chave, p.id as string]));

  return {
    ...corpoFamilia(form),
    pessoas: pessoas.map((p) => {
      const corpo = corpoPessoa(p);
      // Estimativa intocada: volta o par original, para a idade não "rejuvenescer".
      const original = p.original;
      if (original && original.idadeEstimada !== null && !p.dataNascimento
        && p.idadeEstimada.trim() === original.idadeExibida) {
        corpo.idadeEstimada = original.idadeEstimada;
        corpo.idadeEstimadaEm = original.idadeEstimadaEm;
      }
      return { id: p.id ?? null, ...corpo };
    }),
    fontesRenda: form.fontes.map((f) => ({
      id: f.id ?? null,
      tipo: f.tipo as TipoFonteRenda,
      pessoaId: idPorChave.get(f.pessoa) ?? null,
      observacao: textoOuNulo(f.observacao),
    })),
  };
}
