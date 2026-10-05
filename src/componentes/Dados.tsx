/**
 * Um dado de leitura (rótulo + valor) dentro de `<dl className="dados">`.
 * É o formato das fichas: texto que o leitor de tela lê como "rótulo, valor",
 * em vez de campo desabilitado ("indisponível") que o Tab pula.
 * Valor vazio aparece como "—".
 */
export function Dado({ rotulo, children, larga }: { rotulo: string; children: React.ReactNode; larga?: boolean }) {
  return (
    <div className={larga ? 'dados__larga' : undefined}>
      <dt>{rotulo}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}
