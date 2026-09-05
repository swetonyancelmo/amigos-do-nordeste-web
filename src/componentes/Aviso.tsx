type Props = {
  /** Etiqueta curta em caixa alta. Opcional. */
  titulo?: string;
  /**
   * `explicacao` (verde do cacto) para regra do sistema; `erro` (vermelho)
   * para algo que falhou agora. Erro já vem com `role="alert"`.
   */
  tom?: 'explicacao' | 'erro';
  children: React.ReactNode;
};

/**
 * Bloco de recado. Serve para explicar uma regra do sistema no lugar onde a
 * pessoa esbarra nela — como o "não existe criar conta aqui" do login, que é
 * decisão de projeto e não falta de funcionalidade.
 */
export function Aviso({ titulo, tom = 'explicacao', children }: Props) {
  const erro = tom === 'erro';

  return (
    <div className={erro ? 'aviso aviso--erro' : 'aviso'} role={erro ? 'alert' : undefined}>
      {titulo && <p className="aviso__titulo">{titulo}</p>}
      <p className="aviso__texto">{children}</p>
    </div>
  );
}
