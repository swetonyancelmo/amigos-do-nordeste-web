'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import { Modal } from '@/componentes/Modal';
import { Selecao } from '@/componentes/Selecao';
import { api } from '@/lib/api';
import { data, dataHora } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type {
  AbastecimentoAgua, AprovarPreCadastro, Comunidade, ComplementoPessoa, EscoamentoSanitario,
  FaixaRenda, FamiliaGravada, Opcao, Parentesco, PessoaColetada, PreCadastroDetalhe, Serie,
  TamanhoRoupa, TipoFonteRenda, TratamentoAgua,
} from '@/tipos/dominio';
import estilos from '../chamados.module.css';

/** Campo booleano que pode ficar sem resposta: '' é "não informado", não "não". */
type TresEstados = '' | 'true' | 'false';
const SIM_NAO: Opcao[] = [
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
];
const paraBooleano = (v: TresEstados) => (v === '' ? null : v === 'true');
const ouNulo = <T extends string>(v: T | '') => (v === '' ? null : v);

type FormPessoa = {
  parentesco: Parentesco | '';
  estuda: TresEstados;
  serie: Serie | '';
  tamanhoRoupa: TamanhoRoupa | '';
  numeroCalcado: string;
  gestante: TresEstados;
};

type FormFonte = {
  tipo: TipoFonteRenda | '';
  pessoaIndice: string;
  faixa: FaixaRenda | '';
};

const PESSOA_VAZIA: FormPessoa = {
  parentesco: '', estuda: '', serie: '', tamanhoRoupa: '', numeroCalcado: '', gestante: '',
};

/**
 * Revisão de um chamado. A agente coleta pouco de propósito (nome, telefone,
 * comunidade e as pessoas com sexo e idade); é aqui que o cadastro fica
 * completo — moradia, renda e, por pessoa, parentesco, escola, roupa e
 * calçado. Sem roupa e calçado a família fica fora do relatório de
 * necessidades, por isso os campos estão à mão, mas nenhum é obrigatório.
 *
 * Aprovar cria a família pelo mesmo caminho do cadastro do painel. Devolver
 * manda de volta para a agente com o motivo, que ela lê no app.
 */
export default function RevisaoChamado() {
  const { id } = useParams<{ id: string }>();
  useCabecalho('Chamado');
  const { metadados } = useMetadados();

  const [detalhe, setDetalhe] = useState<PreCadastroDetalhe | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);

  const [comunidadeId, setComunidadeId] = useState('');
  const [cpf, setCpf] = useState('');
  const [temBanheiro, setTemBanheiro] = useState<TresEstados>('');
  const [escoamento, setEscoamento] = useState<EscoamentoSanitario | ''>('');
  const [tratamento, setTratamento] = useState<TratamentoAgua | ''>('');
  const [abastecimento, setAbastecimento] = useState<AbastecimentoAgua[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [pessoas, setPessoas] = useState<FormPessoa[]>([]);
  const [fontes, setFontes] = useState<FormFonte[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [aprovada, setAprovada] = useState<FamiliaGravada | null>(null);
  const [devolvendo, setDevolvendo] = useState(false);
  const [motivo, setMotivo] = useState('');

  const carregar = useCallback(() => {
    setErroCarga(null);
    return api.get<PreCadastroDetalhe>(`/pre-cadastros/${id}`)
      .then((d) => {
        setDetalhe(d);
        setComunidadeId(d.comunidadeId ?? '');
        setPessoas(d.pessoas.map(() => ({ ...PESSOA_VAZIA })));
      })
      .catch((e) => setErroCarga(e instanceof Error ? e.message : 'Não foi possível carregar.'));
  }, [id]);

  useEffect(() => {
    void carregar();
    api.get<Comunidade[]>('/comunidades').then(setComunidades).catch(() => setComunidades([]));
  }, [carregar]);

  const opcoesComunidade = useMemo<Opcao[]>(
    () => comunidades.map((c) => ({ valor: c.id, rotulo: `${c.nome} · ${c.municipioNome}` })),
    [comunidades],
  );
  const opcoesPessoa = useMemo<Opcao[]>(
    () => (detalhe?.pessoas ?? []).map((p) => ({ valor: String(p.indice), rotulo: nomeDaPessoa(p) })),
    [detalhe],
  );

  function mudarPessoa(indice: number, mudanca: Partial<FormPessoa>) {
    setPessoas((atual) => atual.map((p, i) => (i === indice ? { ...p, ...mudanca } : p)));
  }

  function mudarFonte(indice: number, mudanca: Partial<FormFonte>) {
    setFontes((atual) => atual.map((f, i) => (i === indice ? { ...f, ...mudanca } : f)));
  }

  function alternarAbastecimento(valor: AbastecimentoAgua) {
    setAbastecimento((atual) =>
      atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]);
  }

  async function aprovar() {
    if (!detalhe) return;
    setErroAcao(null);
    if (!comunidadeId) {
      setErroAcao('Escolha a comunidade: o servidor não reconheceu a que a agente mandou.');
      return;
    }
    if (fontes.some((f) => f.tipo === '')) {
      setErroAcao('Escolha o tipo de cada fonte de renda, ou remova a que ficou em branco.');
      return;
    }

    const complementos: ComplementoPessoa[] = pessoas.map((p, indice) => ({
      indice,
      parentesco: ouNulo(p.parentesco),
      estuda: paraBooleano(p.estuda),
      serie: p.estuda === 'true' ? ouNulo(p.serie) : null,
      tamanhoRoupa: ouNulo(p.tamanhoRoupa),
      numeroCalcado: p.numeroCalcado || null,
      gestante: paraBooleano(p.gestante),
    }));

    const corpo: AprovarPreCadastro = {
      comunidadeId: comunidadeId !== detalhe.comunidadeId ? comunidadeId : null,
      responsavelCpf: cpf.trim() || null,
      temBanheiro: paraBooleano(temBanheiro),
      escoamentoSanitario: ouNulo(escoamento),
      tratamentoAgua: ouNulo(tratamento),
      abastecimentoAgua: abastecimento,
      pessoas: complementos,
      fontesRenda: fontes.map((f) => ({
        tipo: f.tipo as TipoFonteRenda,
        pessoaIndice: f.pessoaIndice === '' ? null : Number(f.pessoaIndice),
        faixa: ouNulo(f.faixa),
        observacao: null,
      })),
      observacoes: observacoes.trim() || null,
    };

    setEnviando(true);
    try {
      const familia = await api.post<FamiliaGravada>(`/pre-cadastros/${id}/aprovar`, corpo);
      setAprovada(familia);
      await carregar();
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível aprovar.');
    } finally {
      setEnviando(false);
    }
  }

  async function devolver() {
    setErroAcao(null);
    setEnviando(true);
    try {
      await api.post(`/pre-cadastros/${id}/devolver`, { motivo: motivo.trim() });
      setDevolvendo(false);
      setMotivo('');
      await carregar();
    } catch (e) {
      setDevolvendo(false);
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível devolver.');
    } finally {
      setEnviando(false);
    }
  }

  if (erroCarga) {
    return (
      <section className={estilos.pagina}>
        <Aviso tom="erro" titulo="Não deu para abrir o chamado">{erroCarga}</Aviso>
        <Link className={estilos.link} href="/chamados">Voltar para os chamados</Link>
      </section>
    );
  }

  if (!detalhe) {
    return <p className="texto-apoio" role="status">Carregando…</p>;
  }

  const pendente = detalhe.situacao === 'PENDENTE';
  const rotuloSituacao = metadados?.situacaoPreCadastro.find((o) => o.valor === detalhe.situacao)?.rotulo
    ?? detalhe.situacao;

  return (
    <section className={estilos.pagina}>
      <Link className={estilos.link} href="/chamados">← Voltar para os chamados</Link>

      <div className={`cartao ${estilos.secao}`}>
        <h2 className={estilos.secaoTitulo}>O que a agente coletou</h2>
        <dl className={estilos.dados}>
          <div><dt>Responsável</dt><dd>{detalhe.responsavelNome}</dd></div>
          <div><dt>Telefone</dt><dd>{detalhe.telefone ?? '—'}</dd></div>
          <div>
            <dt>Comunidade</dt>
            <dd>{detalhe.comunidadeNome ?? '—'}{!detalhe.comunidadeId && ' (não reconhecida)'}</dd>
          </div>
          <div><dt>Ponto de referência</dt><dd>{detalhe.pontoReferencia ?? '—'}</dd></div>
          <div><dt>Agente</dt><dd>{detalhe.agenteNome}</dd></div>
          <div><dt>Cadastrado no celular</dt><dd>{dataHora(detalhe.criadoEm)}</dd></div>
          <div><dt>Recebido</dt><dd>{dataHora(detalhe.recebidoEm)}</dd></div>
          <div><dt>Situação</dt><dd>{rotuloSituacao}</dd></div>
        </dl>

        {detalhe.possivelDuplicata && (
          <Aviso titulo="Possível duplicata">
            Já existe a família de {detalhe.possivelDuplicata.nome} nesta comunidade
            {detalhe.possivelDuplicata.motivo === 'TELEFONE_IGUAL'
              ? ', com o mesmo telefone.'
              : ', com o nome da responsável parecido.'}
            {' '}Confira antes de aprovar: se for a mesma, devolva explicando.
          </Aviso>
        )}
      </div>

      {aprovada && (
        <Aviso titulo="Família criada">
          O chamado foi aprovado e a família entrou no cadastro com {aprovada.totais.totalPessoas}{' '}
          {aprovada.totais.totalPessoas === 1 ? 'pessoa' : 'pessoas'}.
        </Aviso>
      )}

      {!pendente && detalhe.situacao === 'DEVOLVIDO' && (
        <Aviso titulo="Devolvido para a agente">
          Motivo: {detalhe.motivoDevolucao}. Quando ela corrigir e enviar de novo, o chamado volta para a fila.
        </Aviso>
      )}

      {!pendente && detalhe.situacao === 'APROVADO' && !aprovada && (
        <Aviso titulo="Aprovado">Este chamado já virou família em {dataHora(detalhe.avaliadoEm)}.</Aviso>
      )}

      {erroAcao && <Aviso tom="erro" titulo="Não deu certo">{erroAcao}</Aviso>}

      {pendente ? (
        <>
          <div className={`cartao ${estilos.secao}`}>
            <h2 className={estilos.secaoTitulo}>Família</h2>
            <div className={estilos.grade}>
              <Selecao
                rotulo="Comunidade"
                opcoes={opcoesComunidade}
                vazio="Escolha a comunidade"
                value={comunidadeId}
                onChange={(e) => setComunidadeId(e.target.value)}
                erro={!comunidadeId ? 'Obrigatória para aprovar' : undefined}
              />
              <Campo
                rotulo="CPF da responsável"
                inputMode="numeric"
                maxLength={14}
                placeholder="Opcional"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
              <Selecao
                rotulo="Tem banheiro?"
                opcoes={SIM_NAO}
                vazio="Não informado"
                value={temBanheiro}
                onChange={(e) => setTemBanheiro(e.target.value as TresEstados)}
              />
              <Selecao
                rotulo="Escoamento sanitário"
                opcoes={metadados?.escoamentoSanitario}
                vazio="Não informado"
                value={escoamento}
                onChange={(e) => setEscoamento(e.target.value as EscoamentoSanitario | '')}
              />
              <Selecao
                rotulo="Tratamento da água"
                opcoes={metadados?.tratamentoAgua}
                vazio="Não informado"
                value={tratamento}
                onChange={(e) => setTratamento(e.target.value as TratamentoAgua | '')}
              />
            </div>

            <fieldset className={estilos.opcoesMarcar}>
              <legend>Abastecimento de água (pode marcar mais de um)</legend>
              {metadados?.abastecimentoAgua.map((o) => (
                <label key={o.valor} className={estilos.marcar}>
                  <input
                    type="checkbox"
                    checked={abastecimento.includes(o.valor as AbastecimentoAgua)}
                    onChange={() => alternarAbastecimento(o.valor as AbastecimentoAgua)}
                  />
                  {o.rotulo}
                </label>
              ))}
            </fieldset>

            <div className="campo">
              <label className="campo__rotulo" htmlFor="observacoes-chamado">Observações</label>
              <textarea
                id="observacoes-chamado"
                className={`campo__entrada ${estilos.textoLongo}`}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className={`cartao ${estilos.secao}`}>
            <h2 className={estilos.secaoTitulo}>Pessoas</h2>
            {detalhe.pessoas.length === 0 && <p className="texto-apoio">A agente não incluiu pessoas.</p>}
            {detalhe.pessoas.map((p) => {
              const form = pessoas[p.indice] ?? PESSOA_VAZIA;
              return (
                <div key={p.indice} className={estilos.pessoa}>
                  <div className={estilos.pessoaCabecalho}>
                    <p className={estilos.pessoaNome}>{nomeDaPessoa(p)}</p>
                    <span className="texto-apoio">{descreverPessoa(p, metadados?.sexo)}</span>
                  </div>
                  <div className={estilos.grade}>
                    <Selecao
                      rotulo="Parentesco"
                      opcoes={metadados?.parentesco}
                      vazio="Não informado"
                      value={form.parentesco}
                      onChange={(e) => mudarPessoa(p.indice, { parentesco: e.target.value as Parentesco | '' })}
                    />
                    <Selecao
                      rotulo="Estuda?"
                      opcoes={SIM_NAO}
                      vazio="Não informado"
                      value={form.estuda}
                      onChange={(e) => mudarPessoa(p.indice, { estuda: e.target.value as TresEstados })}
                    />
                    {form.estuda === 'true' && (
                      <Selecao
                        rotulo="Série"
                        opcoes={metadados?.serie}
                        vazio="Não informada"
                        value={form.serie}
                        onChange={(e) => mudarPessoa(p.indice, { serie: e.target.value as Serie | '' })}
                      />
                    )}
                    <Selecao
                      rotulo="Tamanho de roupa"
                      opcoes={metadados?.tamanhoRoupa}
                      vazio="Não informado"
                      value={form.tamanhoRoupa}
                      onChange={(e) => mudarPessoa(p.indice, { tamanhoRoupa: e.target.value as TamanhoRoupa | '' })}
                    />
                    <Selecao
                      rotulo="Número do calçado"
                      opcoes={metadados?.numeroCalcado}
                      vazio="Não informado"
                      value={form.numeroCalcado}
                      onChange={(e) => mudarPessoa(p.indice, { numeroCalcado: e.target.value })}
                    />
                    {p.sexo !== 'MASCULINO' && (
                      <Selecao
                        rotulo="Gestante?"
                        opcoes={SIM_NAO}
                        vazio="Não informado"
                        value={form.gestante}
                        onChange={(e) => mudarPessoa(p.indice, { gestante: e.target.value as TresEstados })}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`cartao ${estilos.secao}`}>
            <h2 className={estilos.secaoTitulo}>Fontes de renda</h2>
            {fontes.length === 0 && <p className="texto-apoio">Nenhuma fonte de renda informada.</p>}
            {fontes.map((f, i) => (
              <div key={i} className={estilos.linhaRenda}>
                <Selecao
                  rotulo="Tipo"
                  opcoes={metadados?.tipoFonteRenda}
                  vazio="Escolha o tipo"
                  value={f.tipo}
                  onChange={(e) => mudarFonte(i, { tipo: e.target.value as TipoFonteRenda | '' })}
                />
                <Selecao
                  rotulo="Quem recebe"
                  opcoes={opcoesPessoa}
                  vazio="A família"
                  value={f.pessoaIndice}
                  onChange={(e) => mudarFonte(i, { pessoaIndice: e.target.value })}
                />
                <Selecao
                  rotulo="Faixa"
                  opcoes={metadados?.faixaRenda}
                  vazio="Não informada"
                  value={f.faixa}
                  onChange={(e) => mudarFonte(i, { faixa: e.target.value as FaixaRenda | '' })}
                />
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={() => setFontes((atual) => atual.filter((_, j) => j !== i))}
                >
                  Remover
                </Botao>
              </div>
            ))}
            <div>
              <Botao
                type="button"
                variante="secundario"
                onClick={() => setFontes((atual) => [...atual, { tipo: '', pessoaIndice: '', faixa: '' }])}
              >
                Adicionar fonte de renda
              </Botao>
            </div>
          </div>

          <div className={estilos.acoes}>
            <Botao type="button" variante="secundario" disabled={enviando} onClick={() => setDevolvendo(true)}>
              Devolver para a agente
            </Botao>
            <Botao type="button" disabled={enviando} onClick={aprovar}>
              {enviando ? 'Enviando…' : 'Aprovar e criar família'}
            </Botao>
          </div>
        </>
      ) : null}

      <Modal aberto={devolvendo} titulo="Devolver para a agente" onFechar={() => setDevolvendo(false)}>
        <form
          className={estilos.secao}
          onSubmit={(e) => {
            e.preventDefault();
            void devolver();
          }}
        >
          <div className="campo">
            <label className="campo__rotulo" htmlFor="motivo-devolucao">
              O que ela precisa corrigir?
            </label>
            <textarea
              id="motivo-devolucao"
              className={`campo__entrada ${estilos.textoLongo}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              autoFocus
            />
            <span className="campo__ajuda">A agente lê exatamente este texto no celular.</span>
          </div>
          <div className={estilos.acoes}>
            <Botao type="button" variante="secundario" onClick={() => setDevolvendo(false)}>Cancelar</Botao>
            <Botao type="submit" disabled={enviando || motivo.trim() === ''}>
              {enviando ? 'Enviando…' : 'Devolver'}
            </Botao>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function nomeDaPessoa(p: PessoaColetada): string {
  return p.nome?.trim() || `Pessoa ${p.indice + 1} (sem nome)`;
}

function descreverPessoa(p: PessoaColetada, sexos: Opcao[] | undefined): string {
  const partes: string[] = [];
  if (p.sexo) partes.push(sexos?.find((o) => o.valor === p.sexo)?.rotulo ?? p.sexo);
  if (p.idade === null) partes.push('sem idade');
  else if (p.dataNascimento) partes.push(`${p.idade} anos (nasceu em ${data(p.dataNascimento)})`);
  else partes.push(`uns ${p.idade} anos (estimada)`);
  if (p.cadastroIncompleto) partes.push('cadastro incompleto');
  return partes.join(' · ');
}
