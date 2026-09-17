'use client';

import { Modal } from '@/componentes/Modal';
import { PessoaForm, type PessoaFormulario } from './PessoaForm';

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (pessoa: PessoaFormulario) => void;
  valorInicial?: Partial<PessoaFormulario>;
};

export type { PessoaFormulario };

export function ModalPessoa({ aberto, onFechar, onSalvar, valorInicial }: Props) {
  return (
    <Modal aberto={aberto} titulo="Nova pessoa" onFechar={onFechar}>
      <PessoaForm valorInicial={valorInicial} onSalvar={onSalvar} onFechar={onFechar} />
    </Modal>
  );
}
