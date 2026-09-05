import { useId } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  /** Texto curto abaixo do campo. Some quando há erro. */
  ajuda?: string;
  /** Mensagem de validação deste campo. Marca o input como inválido. */
  erro?: string;
};

/**
 * Campo de texto com rótulo. Use sempre este componente em vez de montar
 * `<label>` + `<input>` na mão: aqui o `id`, o `aria-describedby` e o estado
 * inválido já vêm ligados, e é isso que faz o leitor de tela anunciar o erro
 * junto do campo em vez de largar a mensagem solta no fim do formulário.
 */
export function Campo({ rotulo, ajuda, erro, id, ...resto }: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idApoio = `${idCampo}-apoio`;
  const apoio = erro ?? ajuda;

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={idCampo}>
        {rotulo}
      </label>
      <input
        {...resto}
        id={idCampo}
        className="campo__entrada"
        aria-invalid={erro ? true : undefined}
        aria-describedby={apoio ? idApoio : undefined}
      />
      {apoio && (
        <span id={idApoio} className={erro ? 'campo__ajuda campo__ajuda--erro' : 'campo__ajuda'}>
          {apoio}
        </span>
      )}
    </div>
  );
}
