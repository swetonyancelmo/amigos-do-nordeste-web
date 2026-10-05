'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Selecao } from '@/componentes/Selecao';
import { api } from '@/lib/api';
import { hoje } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type {
  AbastecimentoAgua, Comunidade, EscoamentoSanitario, FaixaRenda, FamiliaGravada, Opcao,
  Parentesco, Serie, Sexo, TamanhoRoupa, TipoFonteRenda, TratamentoAgua,
} from '@/tipos/dominio';
import estilos from './nova.module.css';

/** Campo booleano que pode ficar sem resposta: '' é "não informado", não "não". */
type TresEstados = '' | 'true' | 'false';
const SIM_NAO: Opcao[] = [
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
];
const paraBooleano = (v: TresEstados) => (v === '' ? null : v === 'true');
const ouNulo = <T extends string>(v: T | '') => (v === '' ? null : v);
const textoOuNulo = (v: string) => v.trim() || null;

/** `chave` só existe na tela: liga a fonte de renda à pessoa mesmo se a ordem mudar. */
type FormPessoa = {
  chave: string;
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
type FormFonte = {
  chave: string;
  tipo: TipoFonteRenda | '';
  /** '' = renda da família; senão, a `chave` de quem recebe. */
  pessoa: string;
  observacao: string;
};

type Formulario = {
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
const novaChave = () => `linha-${++contador}`;

const novaPessoa = (parentesco: Parentesco | '' = ''): FormPessoa => ({
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
const formularioVazio = (comunidadeId = ''): Formulario => ({
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
const pessoaEmBranco = (p: FormPessoa) =>
  !p.nome.trim() && !p.sexo && !p.dataNascimento && !p.idadeEstimada.trim() && !p.parentesco
  && !p.estuda && !p.tamanhoRoupa && !p.numeroCalcado && !p.gestante;

/** Só para o resumo da tela; quem conta de verdade é a API. */
function idadeDe(p: FormPessoa): number | null {
  if (p.dataNascimento) {
    const [ano, mes, dia] = p.dataNascimento.split('-').map(Number);
    const [anoH, mesH, diaH] = hoje().split('-').map(Number);
    const idade = anoH - ano - (mesH < mes || (mesH === mes && diaH < dia) ? 1 : 0);
    return idade >= 0 ? idade : null;
  }
  const estimada = p.idadeEstimada.trim();
  return estimada ? Number(estimada) : null;
}

/**
 * Monta o `CriarFamiliaRequisicao`. A fonte de renda aponta para a pessoa pela
 * posição em `pessoas[]` (ela ainda não tem id), então o índice é calculado
 * aqui, depois de tirar as linhas em branco.
 */
function montarCorpo(form: Formulario) {
  const pessoas = form.pessoas.filter((p) => !pessoaEmBranco(p));
  const indicePorChave = new Map(pessoas.map((p, i) => [p.chave, i]));

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
    pessoas: pessoas.map((p) => {
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
        observacoes: null,
      };
    }),
    fontesRenda: form.fontes.map((f) => ({
      tipo: f.tipo as TipoFonteRenda,
      pessoaIndice: indicePorChave.get(f.pessoa) ?? null,
      observacao: textoOuNulo(f.observacao),
    })),
  };
}

const ID_RESPONSAVEL = 'nome-responsavel';
const ID_COMUNIDADE = 'comunidade-familia';
const idTipoFonte = (chave: string) => `tipo-fonte-${chave}`;

/** Erro de cada campo obrigatório, mostrado embaixo dele (WCAG 3.3.1). */
type ErrosCampo = {
  comunidadeId?: string;
  responsavelNome?: string;
  /** Por `chave` da fonte de renda. */
  fontes?: Record<string, string>;
};

/** Valida tudo de uma vez, na ordem da tela; o primeiro da lista recebe o foco. */
function validar(form: Formulario) {
  const erros: ErrosCampo = {};
  const lista: { id: string; mensagem: string }[] = [];
  if (!form.comunidadeId) {
    erros.comunidadeId = 'Escolha a comunidade da família.';
    lista.push({ id: ID_COMUNIDADE, mensagem: erros.comunidadeId });
  }
  if (!form.responsavelNome.trim()) {
    erros.responsavelNome = 'Informe o nome da responsável.';
    lista.push({ id: ID_RESPONSAVEL, mensagem: erros.responsavelNome });
  }
  form.fontes.forEach((f, i) => {
    if (f.tipo !== '') return;
    const mensagem = 'Escolha o tipo desta fonte de renda, ou remova a linha.';
    erros.fontes = { ...erros.fontes, [f.chave]: mensagem };
    lista.push({ id: idTipoFonte(f.chave), mensagem: `Fonte de renda ${i + 1}: escolha o tipo, ou remova a linha.` });
  });
  return { erros, lista };
}

const ACOES = (
  <Link href="/familias" className="botao botao--secundario">
    Voltar para a lista
  </Link>
);

/**
 * Cadastro de família pelo painel (`POST /api/familias`): responsável,
 * moradia, as pessoas da casa e a renda, numa chamada só.
 *
 * Feita para digitar rápido uma pilha de fichas de papel: Enter salva e o
 * formulário volta limpo, com a mesma comunidade, pronto para a próxima.
 * Nada aqui é obrigatório além da comunidade e do nome da responsável; o que
 * faltar a usuária completa depois. Os totais do rodapé são só conferência:
 * quem conta é a API, nada calculado é enviado.
 */
export default function NovaFamilia() {
  useCabecalho('Nova família', ACOES);

  const { metadados } = useMetadados();
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [form, setForm] = useState<Formulario>(() => formularioVazio());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<ErrosCampo>({});
  const [listaErros, setListaErros] = useState<string[]>([]);
  const [salva, setSalva] = useState<FamiliaGravada | null>(null);

  useEffect(() => {
    api.get<Comunidade[]>('/comunidades').then(setComunidades).catch(() => setComunidades([]));
  }, []);

  const opcoesComunidade = useMemo<Opcao[]>(
    () => comunidades.map((c) => ({ valor: c.id, rotulo: `${c.nome} · ${c.municipioNome}` })),
    [comunidades],
  );
  const opcoesPessoa = useMemo<Opcao[]>(
    () => form.pessoas.map((p, i) => ({ valor: p.chave, rotulo: p.nome.trim() || `Pessoa ${i + 1} (sem nome)` })),
    [form.pessoas],
  );

  function mudar<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    if (chave === 'comunidadeId') setErrosCampo((atual) => ({ ...atual, comunidadeId: undefined }));
  }

  function mudarResponsavel(nome: string) {
    setErrosCampo((atual) => ({ ...atual, responsavelNome: undefined }));
    setForm((atual) => {
      const [primeira, ...resto] = atual.pessoas;
      // A primeira linha acompanha o nome enquanto ninguém o editou ali.
      const acompanha = primeira && primeira.parentesco === 'RESPONSAVEL'
        && primeira.nome === atual.responsavelNome;
      return {
        ...atual,
        responsavelNome: nome,
        pessoas: acompanha ? [{ ...primeira, nome }, ...resto] : atual.pessoas,
      };
    });
  }

  function mudarPessoa(chave: string, mudanca: Partial<FormPessoa>) {
    setForm((atual) => ({
      ...atual,
      pessoas: atual.pessoas.map((p) => {
        if (p.chave !== chave) return p;
        return {
          ...p,
          ...mudanca,
          // Data e estimativa não andam juntas: preencher uma limpa a outra.
          ...(mudanca.dataNascimento ? { idadeEstimada: '' } : {}),
          ...(mudanca.idadeEstimada ? { dataNascimento: '' } : {}),
          ...(mudanca.sexo === 'MASCULINO' ? { gestante: '' as const } : {}),
        };
      }),
    }));
  }

  function removerPessoa(chave: string) {
    setForm((atual) => ({
      ...atual,
      pessoas: atual.pessoas.filter((p) => p.chave !== chave),
      // A renda de quem saiu fica com a família, em vez de sumir.
      fontes: atual.fontes.map((f) => (f.pessoa === chave ? { ...f, pessoa: '' } : f)),
    }));
  }

  function mudarFonte(chave: string, mudanca: Partial<FormFonte>) {
    if (mudanca.tipo) {
      setErrosCampo((atual) => {
        const fontes = { ...atual.fontes };
        delete fontes[chave];
        return { ...atual, fontes };
      });
    }
    setForm((atual) => ({
      ...atual,
      fontes: atual.fontes.map((f) => (f.chave === chave ? { ...f, ...mudanca } : f)),
    }));
  }

  function alternarAbastecimento(valor: AbastecimentoAgua) {
    setForm((atual) => ({
      ...atual,
      abastecimentoAgua: atual.abastecimentoAgua.includes(valor)
        ? atual.abastecimentoAgua.filter((v) => v !== valor)
        : [...atual.abastecimentoAgua, valor],
    }));
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    const { erros, lista } = validar(form);
    setErrosCampo(erros);
    setListaErros(lista.map((e) => e.mensagem));
    if (lista.length > 0) {
      document.getElementById(lista[0].id)?.focus();
      return;
    }

    setEnviando(true);
    try {
      const familia = await api.post<FamiliaGravada>('/familias', montarCorpo(form));
      setSalva(familia);
      // A próxima ficha quase sempre é da mesma comunidade.
      setForm(formularioVazio(form.comunidadeId));
      window.scrollTo({ top: 0 });
      document.getElementById(ID_RESPONSAVEL)?.focus();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a família.');
    } finally {
      setEnviando(false);
    }
  }

  const idades = form.pessoas.filter((p) => !pessoaEmBranco(p)).map(idadeDe);
  const resumo = [
    { rotulo: 'pessoas', valor: idades.length },
    { rotulo: 'até 12 anos', valor: idades.filter((i) => i !== null && i <= 12).length },
    { rotulo: '13 a 59 anos', valor: idades.filter((i) => i !== null && i >= 13 && i <= 59).length },
    { rotulo: '60 anos ou mais', valor: idades.filter((i) => i !== null && i >= 60).length },
  ];

  return (
    <form className={estilos.pagina} onSubmit={salvar} noValidate>
      {salva && (
        <Aviso titulo="Família cadastrada">
          A família de {salva.responsavelNome} entrou no cadastro com {salva.totais.totalPessoas}{' '}
          {salva.totais.totalPessoas === 1 ? 'pessoa' : 'pessoas'}. O formulário já está pronto para a
          próxima, na mesma comunidade.
        </Aviso>
      )}

      <div className={`cartao ${estilos.secao}`}>
        <h2 className={estilos.secaoTitulo}>Responsável e contato</h2>
        <div className={estilos.grade}>
          <Selecao
            id={ID_COMUNIDADE}
            rotulo="Comunidade"
            opcoes={opcoesComunidade}
            vazio="Escolha a comunidade"
            value={form.comunidadeId}
            onChange={(e) => mudar('comunidadeId', e.target.value)}
            erro={errosCampo.comunidadeId}
            required
          />
          <Campo
            id={ID_RESPONSAVEL}
            rotulo="Nome da responsável"
            maxLength={120}
            value={form.responsavelNome}
            onChange={(e) => mudarResponsavel(e.target.value)}
            erro={errosCampo.responsavelNome}
            required
            autoFocus
          />
          <Campo
            rotulo="CPF da responsável"
            inputMode="numeric"
            maxLength={14}
            placeholder="Opcional"
            value={form.responsavelCpf}
            onChange={(e) => mudar('responsavelCpf', e.target.value)}
          />
          <Campo
            rotulo="Telefone"
            type="tel"
            inputMode="tel"
            maxLength={20}
            value={form.telefone}
            onChange={(e) => mudar('telefone', e.target.value)}
          />
        </div>
        <Campo
          rotulo="Ponto de referência"
          maxLength={255}
          value={form.pontoReferencia}
          onChange={(e) => mudar('pontoReferencia', e.target.value)}
        />
      </div>

      <div className={`cartao ${estilos.secao}`}>
        <div className={estilos.secaoCabecalho}>
          <h2 className={estilos.secaoTitulo}>Pessoas da casa</h2>
          <span className="texto-apoio">Sem data de nascimento, use a idade estimada.</span>
        </div>

        {form.pessoas.length === 0 && <p className="texto-apoio">Nenhuma pessoa incluída.</p>}
        {form.pessoas.map((p, i) => (
          <div key={p.chave} className={estilos.pessoa}>
            <div className={estilos.pessoaCabecalho}>
              <p className={estilos.pessoaNome}>Pessoa {i + 1}</p>
              <Botao type="button" variante="secundario" onClick={() => removerPessoa(p.chave)}>
                Remover
              </Botao>
            </div>
            <div className={estilos.grade}>
              <Campo
                rotulo="Nome"
                maxLength={120}
                placeholder="Pode ficar em branco"
                value={p.nome}
                onChange={(e) => mudarPessoa(p.chave, { nome: e.target.value })}
              />
              <Selecao
                rotulo="Parentesco"
                opcoes={metadados?.parentesco}
                vazio="Não informado"
                value={p.parentesco}
                onChange={(e) => mudarPessoa(p.chave, { parentesco: e.target.value as Parentesco | '' })}
              />
              <Selecao
                rotulo="Sexo"
                opcoes={metadados?.sexo}
                vazio="Não informado"
                value={p.sexo}
                onChange={(e) => mudarPessoa(p.chave, { sexo: e.target.value as Sexo | '' })}
              />
              <Campo
                rotulo="Data de nascimento"
                type="date"
                max={hoje()}
                value={p.dataNascimento}
                onChange={(e) => mudarPessoa(p.chave, { dataNascimento: e.target.value })}
              />
              <Campo
                rotulo="Idade estimada"
                type="number"
                inputMode="numeric"
                min={0}
                max={130}
                value={p.idadeEstimada}
                onChange={(e) => mudarPessoa(p.chave, { idadeEstimada: e.target.value })}
              />
              <Selecao
                rotulo="Estuda?"
                opcoes={SIM_NAO}
                vazio="Não informado"
                value={p.estuda}
                onChange={(e) => mudarPessoa(p.chave, { estuda: e.target.value as TresEstados })}
              />
              {p.estuda === 'true' && (
                <Selecao
                  rotulo="Série"
                  opcoes={metadados?.serie}
                  vazio="Não informada"
                  value={p.serie}
                  onChange={(e) => mudarPessoa(p.chave, { serie: e.target.value as Serie | '' })}
                />
              )}
              <Selecao
                rotulo="Tamanho de roupa"
                opcoes={metadados?.tamanhoRoupa}
                vazio="Não informado"
                value={p.tamanhoRoupa}
                onChange={(e) => mudarPessoa(p.chave, { tamanhoRoupa: e.target.value as TamanhoRoupa | '' })}
              />
              <Selecao
                rotulo="Número do calçado"
                opcoes={metadados?.numeroCalcado}
                vazio="Não informado"
                value={p.numeroCalcado}
                onChange={(e) => mudarPessoa(p.chave, { numeroCalcado: e.target.value })}
              />
              {p.sexo !== 'MASCULINO' && (
                <Selecao
                  rotulo="Gestante?"
                  opcoes={SIM_NAO}
                  vazio="Não informado"
                  value={p.gestante}
                  onChange={(e) => mudarPessoa(p.chave, { gestante: e.target.value as TresEstados })}
                />
              )}
            </div>
          </div>
        ))}
        <div>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => mudar('pessoas', [...form.pessoas, novaPessoa()])}
          >
            Adicionar pessoa
          </Botao>
        </div>
      </div>

      <div className={`cartao ${estilos.secao}`}>
        <h2 className={estilos.secaoTitulo}>Moradia</h2>
        <div className={estilos.grade}>
          <Selecao
            rotulo="Tem banheiro?"
            opcoes={SIM_NAO}
            vazio="Não informado"
            value={form.temBanheiro}
            onChange={(e) => mudar('temBanheiro', e.target.value as TresEstados)}
          />
          <Selecao
            rotulo="Escoamento sanitário"
            opcoes={metadados?.escoamentoSanitario}
            vazio="Não informado"
            value={form.escoamentoSanitario}
            onChange={(e) => mudar('escoamentoSanitario', e.target.value as EscoamentoSanitario | '')}
          />
          <Selecao
            rotulo="Tratamento da água"
            opcoes={metadados?.tratamentoAgua}
            vazio="Não informado"
            value={form.tratamentoAgua}
            onChange={(e) => mudar('tratamentoAgua', e.target.value as TratamentoAgua | '')}
          />
        </div>

        <fieldset className={estilos.opcoesMarcar}>
          <legend>Abastecimento de água (pode marcar mais de um)</legend>
          {metadados?.abastecimentoAgua.map((o) => (
            <label key={o.valor} className={estilos.marcar}>
              <input
                type="checkbox"
                checked={form.abastecimentoAgua.includes(o.valor as AbastecimentoAgua)}
                onChange={() => alternarAbastecimento(o.valor as AbastecimentoAgua)}
              />
              {o.rotulo}
            </label>
          ))}
        </fieldset>
      </div>

      <div className={`cartao ${estilos.secao}`}>
        <h2 className={estilos.secaoTitulo}>Renda da família</h2>
        <Selecao
          rotulo="Quanto entra na casa por mês, somando tudo"
          opcoes={metadados?.faixaRenda}
          vazio="Não informada"
          value={form.faixaRenda}
          onChange={(e) => mudar('faixaRenda', e.target.value as FaixaRenda | '')}
        />

        <p className={estilos.subtitulo}>De onde vem</p>
        {form.fontes.length === 0 && <p className="texto-apoio">Nenhuma fonte de renda informada.</p>}
        {form.fontes.map((f) => (
          <div key={f.chave} className={estilos.linhaRenda}>
            <Selecao
              id={idTipoFonte(f.chave)}
              rotulo="Tipo"
              opcoes={metadados?.tipoFonteRenda}
              vazio="Escolha o tipo"
              value={f.tipo}
              onChange={(e) => mudarFonte(f.chave, { tipo: e.target.value as TipoFonteRenda | '' })}
              erro={errosCampo.fontes?.[f.chave]}
            />
            <Selecao
              rotulo="Quem recebe"
              opcoes={opcoesPessoa}
              vazio="A família"
              value={f.pessoa}
              onChange={(e) => mudarFonte(f.chave, { pessoa: e.target.value })}
            />
            <Campo
              rotulo="Observação"
              value={f.observacao}
              onChange={(e) => mudarFonte(f.chave, { observacao: e.target.value })}
            />
            <Botao
              type="button"
              variante="secundario"
              onClick={() => mudar('fontes', form.fontes.filter((x) => x.chave !== f.chave))}
            >
              Remover
            </Botao>
          </div>
        ))}
        <div>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => mudar('fontes', [
              ...form.fontes,
              { chave: novaChave(), tipo: '', pessoa: '', observacao: '' },
            ])}
          >
            Adicionar fonte de renda
          </Botao>
        </div>
      </div>

      <div className={`cartao ${estilos.secao}`}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="observacoes-familia">Observações</label>
          <textarea
            id="observacoes-familia"
            className={`campo__entrada ${estilos.textoLongo}`}
            value={form.observacoes}
            onChange={(e) => mudar('observacoes', e.target.value)}
          />
        </div>
      </div>

      {listaErros.length > 0 && (
        <Aviso tom="erro" titulo="Não deu para salvar">
          {listaErros.length === 1 ? 'Corrija o campo marcado:' : `Corrija os ${listaErros.length} campos marcados:`}
          {listaErros.map((m) => (
            <span key={m} className={estilos.itemErro}>{m}</span>
          ))}
        </Aviso>
      )}
      {erro && <Aviso tom="erro" titulo="Não deu para salvar">{erro}</Aviso>}

      <div className={`cartao ${estilos.rodape}`}>
        <dl className={estilos.resumo} aria-label="Conferência antes de salvar">
          {resumo.map(({ rotulo, valor }) => (
            <div key={rotulo} className={estilos.resumoItem}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        <div className={estilos.rodapeAcoes}>
          <Link href="/familias" className="botao botao--secundario">Cancelar</Link>
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar família'}
          </Botao>
        </div>
      </div>
    </form>
  );
}
