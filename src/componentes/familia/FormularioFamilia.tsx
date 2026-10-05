'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import { ResumoErros } from '@/componentes/ResumoErros';
import { Selecao } from '@/componentes/Selecao';
import { useErrosDeCampo } from '@/componentes/useErrosDeCampo';
import { api } from '@/lib/api';
import { hoje } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type {
  AbastecimentoAgua, Comunidade, EscoamentoSanitario, FaixaRenda, Opcao,
  Parentesco, Serie, Sexo, TamanhoRoupa, TipoFonteRenda, TratamentoAgua,
} from '@/tipos/dominio';
import {
  ID_COMUNIDADE, ID_RESPONSAVEL, SIM_NAO, idTipoFonte, idadeDe, novaChave, novaPessoa,
  pessoaEmBranco, validar, type FormFonte, type FormPessoa, type Formulario, type TresEstados,
} from './formularioFamilia';
import estilos from './FormularioFamilia.module.css';

type Props = {
  inicial: Formulario;
  /** Texto do botão de enviar. */
  rotuloSalvar: string;
  /**
   * Grava na API. Se lançar, a mensagem aparece no aviso de erro. Se devolver
   * um formulário, ele passa a ser o da tela (a Nova família volta limpa).
   */
  aoEnviar: (form: Formulario) => Promise<Formulario | void>;
  /** Recado no topo, ex.: "Família cadastrada". */
  acima?: ReactNode;
};

/**
 * O formulário de família, igual no cadastro e na edição: responsável,
 * moradia, as pessoas da casa e a renda. Nada aqui é obrigatório além da
 * comunidade e do nome da responsável; o que faltar a usuária completa
 * depois. Os totais do rodapé são só conferência: quem conta é a API, nada
 * calculado é enviado.
 */
export function FormularioFamilia({ inicial, rotuloSalvar, aoEnviar, acima }: Props) {
  const { metadados } = useMetadados();
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [form, setForm] = useState<Formulario>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const validacao = useErrosDeCampo();

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
    if (chave === 'comunidadeId') validacao.limpar(ID_COMUNIDADE);
  }

  function mudarResponsavel(nome: string) {
    validacao.limpar(ID_RESPONSAVEL);
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
    if (mudanca.tipo) validacao.limpar(idTipoFonte(chave));
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
    if (!validacao.mostrar(validar(form))) return;

    setEnviando(true);
    try {
      const proximo = await aoEnviar(form);
      if (proximo) {
        setForm(proximo);
        window.scrollTo({ top: 0 });
        document.getElementById(ID_RESPONSAVEL)?.focus();
      }
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
      {acima}

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
            erro={validacao.erroDe(ID_COMUNIDADE)}
            required
          />
          <Campo
            id={ID_RESPONSAVEL}
            rotulo="Nome da responsável"
            maxLength={120}
            value={form.responsavelNome}
            onChange={(e) => mudarResponsavel(e.target.value)}
            erro={validacao.erroDe(ID_RESPONSAVEL)}
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
              erro={validacao.erroDe(idTipoFonte(f.chave))}
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

      <ResumoErros erros={validacao.resumo} />
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
            {enviando ? 'Salvando…' : rotuloSalvar}
          </Botao>
        </div>
      </div>
    </form>
  );
}
