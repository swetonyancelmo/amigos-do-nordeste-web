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
 * pessoa esbarra nela — o mapa que marca comunidade e não família, a linha
 * nova que já vem com a comunidade preenchida.
 *
 * O contrário também vale: o que a pessoa já sabe não merece um bloco. Este
 * componente já esteve na tela de login explicando que não existe "criar
 * conta", e saiu — quem usa o sistema é uma pessoa só, que não precisa da
 * explicação todo dia. Aviso permanente que ninguém lê vira ruído.
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
