'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { api } from '@/lib/api';
import { hoje } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type {
  FamiliaResumo, Pagina, Parentesco, PessoaDetalhe, PessoaRequisicao, Serie, Sexo, TamanhoRoupa,
} from '@/tipos/dominio';
import styles from '@/app/(app)/pessoas/pessoas.module.css';

type IconeCampo =
  | 'nome' | 'familia' | 'sexo' | 'nascimento' | 'idade' | 'parentesco'
  | 'roupa' | 'calcado' | 'comunidade' | 'estuda' | 'gestante' | 'observacoes' | 'serie' | 'renda';

function IconeFormulario({ nome }: { nome: IconeCampo }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {nome === 'nome' && <><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-3.5 2.8-5 7-5s6.5 1.5 7 5" /></>}
      {nome === 'familia' && <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M16 14c2.4.2 3.9 1.8 4.5 5" /></>}
      {nome === 'sexo' && <><circle cx="9" cy="9" r="4" /><path d="M13 5h5v5M18 5l-4 4M9 13v6M6 16h6" /></>}
      {nome === 'nascimento' && <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>}
      {nome === 'idade' && <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>}
      {nome === 'parentesco' && <><path d="M8 12h8M12 8v8" /><circle cx="12" cy="12" r="8" /></>}
      {nome === 'roupa' && <><path d="m8 5 4 3 4-3 4 3-2 5-2-1v8H8v-8l-2 1-2-5 4-3Z" /></>}
      {nome === 'calcado' && <><path d="M5 18c3.5 0 5.5-1.2 7-4l2-4 2 3c1 1.5 3 2.5 5 3v2H5v-2Z" /><path d="M14 10 11 6" /></>}
      {nome === 'comunidade' && <><path d="m3 11 9-7 9 7" /><path d="M5 10v9h14v-9M9 19v-5h6v5" /></>}
      {nome === 'estuda' && <><path d="m3 9 9-4 9 4-9 4-9-4Z" /><path d="M7 11v5c2.8 2 7.2 2 10 0v-5M21 9v6" /></>}
      {nome === 'gestante' && <><path d="M12 3.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5Z" /><path d="M9.5 10.5c.8 1.3 2.2 2 4.5 2s3.7-.7 4.5-2" /><path d="M12 13.5v6" /><path d="M8.5 18c1.1-1.6 2.4-2.4 3.5-2.4s2.4.8 3.5 2.4" /><path d="M12 9.5v4" /></>}
      {nome === 'observacoes' && <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>}
      {nome === 'serie' && <><path d="M4 5h16v14H4zM8 3v4M16 3v4M4 10h16" /></>}
      {nome === 'renda' && <><circle cx="12" cy="12" r="8" /><path d="M15 9.5c-.7-.7-1.6-1-2.8-1-1.3 0-2.2.6-2.2 1.5 0 2.2 5 1 5 3.5 0 .9-.9 1.5-2.3 1.5-1.2 0-2.2-.4-2.8-1.1M12 6.5v11" /></>}
    </svg>
  );
}

function RotuloCampo({ htmlFor, label, icon }: { htmlFor: string; label: string; icon: IconeCampo }) {
  return (
    <label className={styles.campo__rotulo} htmlFor={htmlFor}>
      <span className={styles.campo__icone}><IconeFormulario nome={icon} /></span>
      <span>{label}</span>
    </label>
  );
}


/** O que a tela edita. Texto vazio vira null ao montar o corpo da requisição. */
type Formulario = {
  nome: string;
  sexo: Sexo | '';
  dataNascimento: string;
  idadeEstimada: string;
  parentesco: Parentesco | '';
  estuda: boolean;
  serie: Serie | '';
  tamanhoRoupa: TamanhoRoupa | '';
  numeroCalcado: string;
  gestante: boolean;
  observacoes: string;
};

/** A família escolhida: só o que a tela mostra e o id para o POST. */
type FamiliaEscolhida = { id: string; responsavelNome: string; comunidadeNome: string };

type Props = {
  /** null = pessoa nova. */
  pessoa: PessoaDetalhe | null;
  onSalvo: () => void;
  onFechar: () => void;
};

const vazio: Formulario = {
  nome: '',
  sexo: '',
  dataNascimento: '',
  idadeEstimada: '',
  parentesco: '',
  estuda: false,
  serie: '',
  tamanhoRoupa: '',
  numeroCalcado: '',
  gestante: false,
  observacoes: '',
};

function dePessoa(p: PessoaDetalhe): Formulario {
  return {
    nome: p.nome ?? '',
    sexo: p.sexo ?? '',
    dataNascimento: p.dataNascimento ?? '',
    idadeEstimada: p.idadeEstimada === null ? '' : String(p.idadeEstimada),
    parentesco: p.parentesco ?? '',
    estuda: p.estuda === true,
    serie: p.serie ?? '',
    tamanhoRoupa: p.tamanhoRoupa ?? '',
    numeroCalcado: p.numeroCalcado ?? '',
    gestante: p.gestante === true,
    observacoes: p.observacoes ?? '',
  };
}

/**
 * Monta a `PessoaRequisicao`. Data de nascimento e idade estimada não vão
 * juntas (a API recusa); a estimativa leva a data em que foi feita, para o
 * sistema envelhecê-la. Se a estimativa não mudou na edição, mantém a data
 * original em vez de "rejuvenescer" a pessoa.
 */
function montarCorpo(form: Formulario, original: PessoaDetalhe | null): PessoaRequisicao {
  const nome = form.nome.trim() || null;
  const idadeTexto = form.idadeEstimada.trim();
  const idadeEstimada = !form.dataNascimento && idadeTexto ? Number(idadeTexto) : null;
  const estimativaMantida = original?.idadeEstimada === idadeEstimada && original?.idadeEstimadaEm;

  return {
    nome,
    // Sem nome a API só aceita com cadastroIncompleto = true; com nome, ela
    // mesma decide (falta de idade também marca incompleto).
    cadastroIncompleto: nome === null,
    sexo: form.sexo || null,
    dataNascimento: form.dataNascimento || null,
    idadeEstimada,
    idadeEstimadaEm: idadeEstimada === null ? null : (estimativaMantida || hoje()),
    parentesco: form.parentesco || null,
    estuda: form.estuda,
    serie: form.estuda ? (form.serie || null) : null,
    tamanhoRoupa: form.tamanhoRoupa || null,
    numeroCalcado: form.numeroCalcado || null,
    gestante: form.sexo === 'FEMININO' ? form.gestante : null,
    observacoes: form.observacoes.trim() || null,
  };
}

function mensagem(e: unknown) {
  return e instanceof Error ? e.message : 'Não foi possível salvar.';
}

export function PessoaForm({ pessoa, onSalvo, onFechar }: Props) {
  const { metadados } = useMetadados();
  const [form, setForm] = useState<Formulario>(pessoa ? dePessoa(pessoa) : vazio);
  const [familia, setFamilia] = useState<FamiliaEscolhida | null>(
    pessoa
      ? { id: pessoa.familia.id, responsavelNome: pessoa.familia.responsavelNome, comunidadeNome: pessoa.comunidade.nome }
      : null,
  );
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<FamiliaResumo[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Busca de família pelo nome do responsável, com uma pausa para não
  // disparar uma requisição por tecla.
  useEffect(() => {
    const termo = busca.trim();
    if (pessoa || familia || termo.length < 2) {
      setResultados(null);
      return;
    }
    let ativo = true;
    const espera = setTimeout(() => {
      const query = new URLSearchParams({ busca: termo, porPagina: '10' });
      api.get<Pagina<FamiliaResumo>>(`/familias?${query}`)
        .then((r) => { if (ativo) setResultados(r.itens); })
        .catch((e) => { if (ativo) setErro(mensagem(e)); });
    }, 300);
    return () => { ativo = false; clearTimeout(espera); };
  }, [busca, familia, pessoa]);

  function alterarCampo<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((atual) => ({
      ...atual,
      [chave]: valor,
      // Data e estimativa não andam juntas: preencher uma limpa a outra.
      ...(chave === 'dataNascimento' && valor ? { idadeEstimada: '' } : {}),
      ...(chave === 'idadeEstimada' && valor ? { dataNascimento: '' } : {}),
      // Homem não pode ficar marcado como gestante ao trocar o sexo.
      ...(chave === 'sexo' && valor !== 'FEMININO' ? { gestante: false } : {}),
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!familia) {
      setErro('Escolha a família da pessoa.');
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const corpo = montarCorpo(form, pessoa);
      if (pessoa) {
        await api.put<PessoaDetalhe>(`/pessoas/${pessoa.id}`, corpo);
      } else {
        await api.post<PessoaDetalhe>(`/familias/${familia.id}/pessoas`, corpo);
      }
      onSalvo();
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    if (!pessoa) return;
    if (!window.confirm('Remover esta pessoa da família? Não dá para desfazer.')) return;

    setEnviando(true);
    setErro(null);
    try {
      await api.delete(`/pessoas/${pessoa.id}`);
      onSalvo();
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.formularioPessoa}>
      <div className={styles.linhaDoisColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="nome-pessoa" label="Nome" icon="nome" />
          <input
            id="nome-pessoa"
            className={styles.campo__entrada}
            value={form.nome}
            maxLength={120}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('nome', event.target.value)}
            placeholder="Ex.: Pessoa de Teste"
          />
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="familia-pessoa" label="Família" icon="familia" />
          {familia ? (
            <div className={styles.linhaRenda}>
              <span>Família de {familia.responsavelNome} · {familia.comunidadeNome}</span>
              {/* Mudar a família de alguém é mudar a família, não a pessoa: só na criação. */}
              {!pessoa && (
                <button type="button" className={styles.botaoRemover} onClick={() => { setFamilia(null); setBusca(''); }}>
                  Trocar
                </button>
              )}
            </div>
          ) : (
            <input
              id="familia-pessoa"
              className={styles.campo__entrada}
              value={busca}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setBusca(event.target.value)}
              placeholder="Busque pelo nome do responsável"
              autoComplete="off"
            />
          )}
        </div>
      </div>

      {!familia && resultados && (
        <div className={styles.secaoFormulario} aria-live="polite">
          {resultados.length === 0 && <p className="texto-apoio">Nenhuma família ativa com esse responsável.</p>}
          {resultados.map((f) => (
            <div key={f.id} className={styles.linhaRenda}>
              <span>Família de {f.responsavelNome} · {f.comunidadeNome}</span>
              <button
                type="button"
                className={styles.botaoAdicionar}
                onClick={() => setFamilia({ id: f.id, responsavelNome: f.responsavelNome, comunidadeNome: f.comunidadeNome })}
              >
                Escolher
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.linhaTresColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="sexo-pessoa" label="Sexo" icon="sexo" />
          <select
            id="sexo-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.sexo}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('sexo', event.target.value as Sexo | '')}
          >
            <option value="">Selecione</option>
            {metadados?.sexo.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="data-nascimento" label="Data de nascimento" icon="nascimento" />
          <input
            id="data-nascimento"
            type="date"
            max={hoje()}
            className={styles.campo__entrada}
            value={form.dataNascimento}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('dataNascimento', event.target.value)}
          />
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="idade-estimada" label="Idade estimada" icon="idade" />
          <input
            id="idade-estimada"
            type="number"
            min={0}
            max={130}
            className={styles.campo__entrada}
            value={form.idadeEstimada}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('idadeEstimada', event.target.value)}
            placeholder="Ex.: 11"
          />
        </div>
      </div>

      <div className={styles.linhaDoisColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="parentesco-pessoa" label="Parentesco" icon="parentesco" />
          <select
            id="parentesco-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.parentesco}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('parentesco', event.target.value as Parentesco | '')}
          >
            <option value="">Selecione</option>
            {metadados?.parentesco.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="tamanho-roupa" label="Tamanho de roupa" icon="roupa" />
          <select
            id="tamanho-roupa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.tamanhoRoupa}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('tamanhoRoupa', event.target.value as TamanhoRoupa | '')}
          >
            <option value="">Selecione</option>
            {metadados?.tamanhoRoupa.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.linhaDoisColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="numero-calcado" label="Número do calçado" icon="calcado" />
          <select
            id="numero-calcado"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.numeroCalcado}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('numeroCalcado', event.target.value)}
          >
            <option value="">Selecione</option>
            {metadados?.numeroCalcado.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <span className={styles.campo__rotulo}>
            <span className={styles.campo__icone}><IconeFormulario nome="comunidade" /></span>
            <span>Comunidade</span>
          </span>
          {/* Vem da família: pessoa não tem comunidade própria. */}
          <p className="texto-apoio">{familia ? familia.comunidadeNome : 'A da família escolhida'}</p>
        </div>
      </div>

      <div className={styles.linhaDoisColunas}>
        <label className={styles.checkboxItem}>
          <input
            type="checkbox"
            checked={form.estuda}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('estuda', event.target.checked)}
          />
          <span className={styles.checkboxTexto}><IconeFormulario nome="estuda" /> Estuda</span>
        </label>

        <label className={styles.checkboxItem}>
          <input
            type="checkbox"
            checked={form.gestante}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('gestante', event.target.checked)}
            disabled={form.sexo !== 'FEMININO'}
          />
          <span className={styles.checkboxTexto}><IconeFormulario nome="gestante" /> Gestante</span>
        </label>
      </div>

      {form.estuda && (
        <div className={styles.campo}>
          <RotuloCampo htmlFor="serie-pessoa" label="Série/Etapa" icon="serie" />
          <select
            id="serie-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.serie}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('serie', event.target.value as Serie | '')}
          >
            <option value="">Selecione</option>
            {metadados?.serie.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.campo}>
        <RotuloCampo htmlFor="observacoes-pessoa" label="Observações" icon="observacoes" />
        <textarea
          id="observacoes-pessoa"
          className={`${styles.campo__entrada} ${styles.campo__textarea}`}
          rows={4}
          value={form.observacoes}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => alterarCampo('observacoes', event.target.value)}
        />
      </div>

      {erro && <Aviso tom="erro" titulo="Não deu para salvar">{erro}</Aviso>}

      <footer className={styles.rodapeFormulario}>
        {pessoa && (
          <button type="button" className={styles.botaoRemover} onClick={remover} disabled={enviando}>
            Remover pessoa
          </button>
        )}
        <div className={styles.botoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar pessoa'}
          </Botao>
        </div>
      </footer>
    </form>
  );
}
