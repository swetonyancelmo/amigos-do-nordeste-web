type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'sucesso';
  largo?: boolean;
};

/**
 * Botão do sistema. `primario` é a ação principal da tela (uma por tela) e
 * `secundario` é o resto. `sucesso` existe só para a decisão que cria um
 * registro novo e não pode ser confundida com a que devolve (chamados): o
 * verde do cacto, não uma terceira cor nova.
 */
export function Botao({ variante = 'primario', largo = false, className, ...resto }: Props) {
  const classes = ['botao', `botao--${variante}`];
  if (largo) classes.push('botao--largo');
  if (className) classes.push(className);

  return <button {...resto} className={classes.join(' ')} />;
}
