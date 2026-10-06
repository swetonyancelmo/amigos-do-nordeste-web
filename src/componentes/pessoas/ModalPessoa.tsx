'use client';

import { useEffect, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Modal } from '@/componentes/Modal';
import { api } from '@/lib/api';
import type { PessoaDetalhe } from '@/tipos/dominio';
import { PessoaForm } from './PessoaForm';

type Props = {
  aberto: boolean;
  /** null = pessoa nova; com id, busca a ficha e abre para editar. */
  pessoaId: string | null;
  onFechar: () => void;
  onSalvo: () => void;
};

export function ModalPessoa({ aberto, pessoaId, onFechar, onSalvo }: Props) {
  const [pessoa, setPessoa] = useState<PessoaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || !pessoaId) return;
    let ativo = true;
    api.get<PessoaDetalhe>(`/pessoas/${pessoaId}`)
      .then((r) => { if (ativo) setPessoa(r); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
    return () => {
      ativo = false;
      setPessoa(null);
      setErro(null);
    };
  }, [aberto, pessoaId]);

  const carregando = pessoaId !== null && pessoa === null && !erro;

  return (
    <Modal aberto={aberto} titulo={pessoaId ? 'Editar pessoa' : 'Nova pessoa'} onFechar={onFechar}>
      {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}
      {carregando && <p className="texto-apoio" role="status">Carregando…</p>}
      {/* key: troca de pessoa recria o formulário com os valores dela. */}
      {!erro && !carregando && (
        <PessoaForm key={pessoa?.id ?? 'nova'} pessoa={pessoa} onSalvo={onSalvo} onFechar={onFechar} />
      )}
    </Modal>
  );
}
