import { Aviso } from './Aviso';

/**
 * Alerta com todos os erros de validação, um por linha. Par do
 * `useErrosDeCampo`: o `role="alert"` do `Aviso` faz o leitor de tela anunciar.
 */
export function ResumoErros({ erros }: { erros: string[] }) {
  if (erros.length === 0) return null;
  return (
    <Aviso tom="erro" titulo="Não deu para salvar">
      {erros.length === 1 ? 'Corrija o campo marcado:' : `Corrija os ${erros.length} campos marcados:`}
      {erros.map((m) => (
        <span key={m} className="aviso__item">{m}</span>
      ))}
    </Aviso>
  );
}
