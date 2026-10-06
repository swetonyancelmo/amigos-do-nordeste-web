/**
 * Conferência do CPF antes de mandar para a API, para a usuária ver o erro no
 * campo. A regra que vale é a da API (`Cpf.java`): esta é a mesma conta.
 * Vazio é válido: o CPF é opcional.
 */
export function cpfValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  if (digitos === '') return valor.trim() === '';
  if (digitos.length !== 11) return false;
  // 111.111.111-11 e parecidos passam na conta, mas não existem
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  return verificador(digitos, 9) === Number(digitos[9]) && verificador(digitos, 10) === Number(digitos[10]);
}

/** Dígito da posição `posicao` a partir dos que vêm antes dele (pesos 10..2 e 11..2). */
function verificador(digitos: string, posicao: number): number {
  let soma = 0;
  for (let i = 0; i < posicao; i++) soma += Number(digitos[i]) * (posicao + 1 - i);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}
