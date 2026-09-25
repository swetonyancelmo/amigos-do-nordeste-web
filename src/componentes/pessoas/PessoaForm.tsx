'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { ModalFonteRenda } from '@/componentes/fonte-renda/ModalFonteRenda';
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

export type PessoaFormulario = {
  id?: string;
  nome: string;
  sexo: 'F' | 'M';
  dataNascimento: string;
  idadeEstimada: string;
  parentesco: string;
  estuda: boolean;
  serie: string;
  tamanhoRoupa: string;
  numeroCalcado: string;
  gestante: boolean;
  observacoes: string;
  familia: string;
  comunidade: string;
  cadastroIncompleto: boolean;
};

type Props = {
  onSalvar: (pessoa: PessoaFormulario) => void;
  onFechar: () => void;
  valorInicial?: Partial<PessoaFormulario>;
};

const valoresIniciais: PessoaFormulario = {
  nome: '',
  sexo: 'F',
  dataNascimento: '',
  idadeEstimada: '',
  parentesco: 'FILHA',
  estuda: false,
  serie: '',
  tamanhoRoupa: 'M',
  numeroCalcado: '',
  gestante: false,
  observacoes: '',
  familia: 'Família da Joana',
  comunidade: 'Jeritacó',
  cadastroIncompleto: false,
};

export function PessoaForm({ onSalvar, onFechar, valorInicial }: Props) {
  const [form, setForm] = useState<PessoaFormulario>({
    ...valoresIniciais,
    ...valorInicial,
  });
  const [modalFonteRendaAberta, setModalFonteRendaAberta] = useState(false);

  const podeMostrarSerie = form.estuda;

  function alterarCampo(chave: keyof PessoaFormulario, valor: string | boolean) {
    setForm((atual) => ({
      ...atual,
      [chave]: valor,
      cadastroIncompleto: !valor && chave === 'nome' ? true : atual.cadastroIncompleto,
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    const pessoa: PessoaFormulario = {
      ...form,
      id: form.id ?? `p-${Date.now()}`,
      cadastroIncompleto: !form.nome.trim() || !form.familia,
    };

    onSalvar(pessoa);
  }

  return (
    <>
    <form onSubmit={onSubmit} className={styles.formularioPessoa}>
      <div className={styles.linhaDoisColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="nome-pessoa" label="Nome" icon="nome" />
          <input
            id="nome-pessoa"
            className={styles.campo__entrada}
            value={form.nome}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('nome', event.target.value)}
            placeholder="Ex.: Maria da Silva"
            required
          />
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="familia-pessoa" label="Família" icon="familia" />
          <input
            id="familia-pessoa"
            className={styles.campo__entrada}
            value={form.familia}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('familia', event.target.value)}
            placeholder="Ex.: Família da Joana"
          />
        </div>
      </div>

      <div className={styles.linhaTresColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="sexo-pessoa" label="Sexo" icon="sexo" />
          <select
            id="sexo-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.sexo}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('sexo', event.target.value)}
          >
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </select>
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="data-nascimento" label="Data de nascimento" icon="nascimento" />
          <input
            id="data-nascimento"
            type="date"
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
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('parentesco', event.target.value)}
          >
            <option value="RESPONSAVEL">Responsável</option>
            <option value="CONJUGE">Cônjuge</option>
            <option value="FILHA">Filha</option>
            <option value="FILHO">Filho</option>
            <option value="NETA">Neta</option>
            <option value="NETO">Neto</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="tamanho-roupa" label="Tamanho de roupa" icon="roupa" />
          <select
            id="tamanho-roupa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.tamanhoRoupa}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('tamanhoRoupa', event.target.value)}
          >
            <option value="RN">RN</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
          </select>
        </div>
      </div>

      <div className={styles.linhaDoisColunas}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="numero-calcado" label="Número do calçado" icon="calcado" />
          <input
            id="numero-calcado"
            className={styles.campo__entrada}
            value={form.numeroCalcado}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('numeroCalcado', event.target.value)}
            placeholder="Ex.: 31"
          />
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="comunidade-pessoa" label="Comunidade" icon="comunidade" />
          <select
            id="comunidade-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.comunidade}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('comunidade', event.target.value)}
          >
            <option value="">Selecione a comunidade</option>
            <option value="Jeritacó">Jeritacó</option>
            <option value="Mulungu">Mulungu</option>
            <option value="Pindorama">Pindorama</option>
            <option value="Morro da Esperança">Morro da Esperança</option>
          </select>
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
            disabled={form.sexo === 'M'}
          />
          <span className={styles.checkboxTexto}><IconeFormulario nome="gestante" /> Gestante</span>
        </label>
      </div>

      {podeMostrarSerie && (
        <div className={styles.campo}>
          <RotuloCampo htmlFor="serie-pessoa" label="Série/Etapa" icon="serie" />
          <select
            id="serie-pessoa"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.serie}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('serie', event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="PRE">Pré</option>
            <option value="FUNDAMENTAL_1">Fundamental 1</option>
            <option value="FUNDAMENTAL_2">Fundamental 2</option>
            <option value="MEDIO">Médio</option>
            <option value="SUPERIOR">Superior</option>
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

      <div className={styles.rodapeFormulario}>
        <button type="button" className={styles.botaoAdicionar} onClick={() => setModalFonteRendaAberta(true)}>
          Adicionar fonte de renda
        </button>
      </div>

      <footer className={styles.rodapeFormulario}>
        <div className={styles.botoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit">Salvar pessoa</Botao>
        </div>
      </footer>
    </form>

    <ModalFonteRenda
      aberto={modalFonteRendaAberta}
      onFechar={() => setModalFonteRendaAberta(false)}
      onSalvar={() => setModalFonteRendaAberta(false)}
    />
    </>
  );
}
