type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario';
  largo?: boolean;
};

/**
 * Botão do sistema. Só existem duas variantes de propósito: `primario` para a
 * ação principal da tela (uma por tela) e `secundario` para o resto.
 */
export function Botao({ variante = 'primario', largo = false, className, ...resto }: Props) {
  const classes = ['botao', `botao--${variante}`];
  if (largo) classes.push('botao--largo');
  if (className) classes.push(className);

  return <button {...resto} className={classes.join(' ')} />;
}
