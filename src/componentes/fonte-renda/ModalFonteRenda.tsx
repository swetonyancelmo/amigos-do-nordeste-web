'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/componentes/Modal';
import type { FaixaRenda, TipoFonteRenda } from '@/tipos/dominio';
import styles from '@/app/(app)/pessoas/pessoas.module.css';

type PessoaOpcao = {
  id: string;
  nome: string;
};

type FonteRendaFormulario = {
  tipo: TipoFonteRenda;
  pessoaIndice: number | null;
  faixa: FaixaRenda | '';
  observacao: string;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (dados: FonteRendaFormulario) => void;
  pessoas?: PessoaOpcao[];
};

const pessoasPadrao: PessoaOpcao[] = [
  { id: 'p-1', nome: 'Maria da Silva' },
  { id: 'p-2', nome: 'João Pereira' },
  { id: 'p-3', nome: 'Ana Souza' },
];

const valoresIniciais: FonteRendaFormulario = {
  tipo: 'TRABALHO_INFORMAL',
  pessoaIndice: null,
  faixa: '',
  observacao: '',
};

type IconeCampo = 'pessoa' | 'renda' | 'observacoes';

function IconeFormulario({ nome }: { nome: IconeCampo }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {nome === 'pessoa' && <><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-3.5 2.8-5 7-5s6.5 1.5 7 5" /></>}
      {nome === 'renda' && <><circle cx="12" cy="12" r="8" /><path d="M15 9.5c-.7-.7-1.6-1-2.8-1-1.3 0-2.2.6-2.2 1.5 0 2.2 5 1 5 3.5 0 .9-.9 1.5-2.3 1.5-1.2 0-2.2-.4-2.8-1.1M12 6.5v11" /></>}
      {nome === 'observacoes' && <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>}
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

export function ModalFonteRenda({
  aberto,
  onFechar,
  onSalvar,
  pessoas = pessoasPadrao,
}: Props) {
  const [form, setForm] = useState<FonteRendaFormulario>(valoresIniciais);

  useEffect(() => {
    if (!aberto) return;
    setForm(valoresIniciais);
  }, [aberto]);

  function alterarCampo(chave: keyof FonteRendaFormulario, valor: string) {
    setForm((atual) => ({
      ...atual,
      [chave]: valor,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSalvar({
      ...form,
      pessoaIndice: form.pessoaIndice === null ? null : Number(form.pessoaIndice),
      faixa: form.faixa || '',
      observacao: form.observacao.trim(),
    });
    onFechar();
  }

  return (
    <Modal aberto={aberto} titulo="Fonte de renda" onFechar={onFechar}>
      <form onSubmit={handleSubmit} className={styles.formularioPessoa}>
        <div className={styles.campo}>
          <RotuloCampo htmlFor="pessoa-renda" label="Pessoa vinculada" icon="pessoa" />
          <select
            id="pessoa-renda"
            className={`${styles.campo__entrada} ${styles.campo__select}`}
            value={form.pessoaIndice === null ? '' : String(form.pessoaIndice)}
            onChange={(event) => alterarCampo('pessoaIndice', event.target.value)}
          >
            <option value="">Opcional — não precisa vincular</option>
            {pessoas.map((pessoa, indice) => (
              <option key={pessoa.id} value={String(indice)}>{pessoa.nome}</option>
            ))}
          </select>
        </div>

        <div className={styles.linhaDoisColunas}>
          <div className={styles.campo}>
            <RotuloCampo htmlFor="tipo-renda" label="Tipo da renda" icon="renda" />
            <select
              id="tipo-renda"
              className={`${styles.campo__entrada} ${styles.campo__select}`}
              value={form.tipo}
              onChange={(event) => alterarCampo('tipo', event.target.value as TipoFonteRenda)}
            >
              <option value="TRABALHO_INFORMAL">Trabalho informal</option>
              <option value="TRABALHO_FIXO">Trabalho fixo</option>
              <option value="TRABALHO_SAZONAL">Trabalho sazonal</option>
              <option value="APOSENTADORIA">Aposentadoria</option>
              <option value="BPC">BPC</option>
              <option value="PENSAO">Pensão</option>
              <option value="BOLSA_FAMILIA">Bolsa Família</option>
              <option value="AUXILIO_DOENCA">Auxílio doença</option>
              <option value="NENHUMA">Nenhuma</option>
              <option value="OUTRA">Outra</option>
            </select>
          </div>

          <div className={styles.campo}>
            <RotuloCampo htmlFor="faixa-renda" label="Faixa" icon="renda" />
            <select
              id="faixa-renda"
              className={`${styles.campo__entrada} ${styles.campo__select}`}
              value={form.faixa}
              onChange={(event) => alterarCampo('faixa', event.target.value as FaixaRenda | '')}
            >
              <option value="">Selecione</option>
              <option value="SEM_RENDA_FIXA">Sem renda fixa</option>
              <option value="ATE_1_SM">Até 1 salário mínimo</option>
              <option value="DE_1_A_2_SM">De 1 a 2 salários mínimos</option>
              <option value="MAIS_DE_2_SM">Mais de 2 salários mínimos</option>
            </select>
          </div>
        </div>

        <div className={styles.campo}>
          <RotuloCampo htmlFor="observacao-renda" label="Observação" icon="observacoes" />
          <textarea
            id="observacao-renda"
            className={`${styles.campo__entrada} ${styles.campo__textarea}`}
            rows={4}
            value={form.observacao}
            onChange={(event) => alterarCampo('observacao', event.target.value)}
            placeholder="Descreva detalhes da renda, se necessário"
          />
        </div>

        <footer className={styles.rodapeFormulario}>
          <div className={styles.botoesFormulario}>
            <button type="button" className="botao botao--secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="botao botao--primario">
              Salvar fonte
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}
