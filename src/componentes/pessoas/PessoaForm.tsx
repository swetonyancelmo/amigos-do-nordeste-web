'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Botao } from '@/componentes/Botao';

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

  const podeMostrarSerie = form.estuda;

  const idadeText = useMemo(() => {
    if (!form.dataNascimento && form.idadeEstimada) return `Idade estimada: ${form.idadeEstimada} anos`;
    return 'Dados pessoais';
  }, [form.dataNascimento, form.idadeEstimada]);

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
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="nome-pessoa">Nome</label>
          <input
            id="nome-pessoa"
            className="campo__entrada"
            value={form.nome}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('nome', event.target.value)}
            placeholder="Ex.: Maria da Silva"
            required
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="familia-pessoa">Família</label>
          <input
            id="familia-pessoa"
            className="campo__entrada"
            value={form.familia}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('familia', event.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="sexo-pessoa">Sexo</label>
          <select
            id="sexo-pessoa"
            className="campo__entrada"
            value={form.sexo}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => alterarCampo('sexo', event.target.value)}
          >
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </select>
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="data-nascimento">Data de nascimento</label>
          <input
            id="data-nascimento"
            type="date"
            className="campo__entrada"
            value={form.dataNascimento}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('dataNascimento', event.target.value)}
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="idade-estimada">Idade estimada</label>
          <input
            id="idade-estimada"
            type="number"
            min={0}
            className="campo__entrada"
            value={form.idadeEstimada}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('idadeEstimada', event.target.value)}
            placeholder="Ex.: 11"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="parentesco-pessoa">Parentesco</label>
          <select
            id="parentesco-pessoa"
            className="campo__entrada"
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

        <div className="campo">
          <label className="campo__rotulo" htmlFor="tamanho-roupa">Tamanho de roupa</label>
          <select
            id="tamanho-roupa"
            className="campo__entrada"
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="numero-calcado">Número do calçado</label>
          <input
            id="numero-calcado"
            className="campo__entrada"
            value={form.numeroCalcado}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('numeroCalcado', event.target.value)}
            placeholder="Ex.: 31"
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="comunidade-pessoa">Comunidade</label>
          <input
            id="comunidade-pessoa"
            className="campo__entrada"
            value={form.comunidade}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('comunidade', event.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <label className="campo" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46 }}>
          <input
            type="checkbox"
            checked={form.estuda}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('estuda', event.target.checked)}
          />
          <span className="campo__rotulo" style={{ margin: 0 }}>Estuda</span>
        </label>

        <label className="campo" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46 }}>
          <input
            type="checkbox"
            checked={form.gestante}
            onChange={(event: ChangeEvent<HTMLInputElement>) => alterarCampo('gestante', event.target.checked)}
            disabled={form.sexo === 'M'}
          />
          <span className="campo__rotulo" style={{ margin: 0 }}>Gestante</span>
        </label>
      </div>

      {podeMostrarSerie && (
        <div className="campo">
          <label className="campo__rotulo" htmlFor="serie-pessoa">Série/Etapa</label>
          <select
            id="serie-pessoa"
            className="campo__entrada"
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

      <div className="campo">
        <label className="campo__rotulo" htmlFor="observacoes-pessoa">Observações</label>
        <textarea
          id="observacoes-pessoa"
          className="campo__entrada"
          rows={4}
          value={form.observacoes}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => alterarCampo('observacoes', event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: 'var(--texto-medio)', fontSize: 12 }}>{idadeText}</span>

        <div style={{ display: 'flex', gap: 12 }}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit">Salvar pessoa</Botao>
        </div>
      </div>
    </form>
  );
}
