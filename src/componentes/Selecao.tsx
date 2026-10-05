import { useId } from 'react';
import type { Opcao } from '@/tipos/dominio';

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  rotulo: string;
  /** Opções no formato de /api/metadados. Nunca escreva a lista à mão. */
  opcoes: Opcao[] | undefined;
  /** Texto da opção vazia (valor ''). Sem ele, não há opção vazia. */
  vazio?: string;
  erro?: string;
};

/**
 * O par do `<Campo>` para lista fechada: rótulo e `<select>` já ligados,
 * mesmo visual da entrada de texto. As opções vêm da API.
 */
export function Selecao({
  rotulo,
  opcoes,
  vazio,
  erro,
  id,
  'aria-describedby': descritoPor,
  'aria-invalid': invalido,
  ...resto
}: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;
  // Mesma regra do `<Campo>`: a descrição que a tela passou convive com a do erro.
  const descricoes = [descritoPor, erro ? idErro : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={idCampo}>
        {rotulo}
      </label>
      <select
        {...resto}
        id={idCampo}
        className="campo__entrada"
        aria-invalid={erro ? true : invalido}
        aria-describedby={descricoes}
      >
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes?.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
        ))}
      </select>
      {erro && (
        <span id={idErro} className="campo__ajuda campo__ajuda--erro">
          {erro}
        </span>
      )}
    </div>
  );
}
