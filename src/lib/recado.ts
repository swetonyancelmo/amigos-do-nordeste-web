/**
 * Recado de uma tela para a próxima ("Família atualizada"). Fica só em
 * memória, no módulo: sobrevive à navegação do Next, some ao recarregar a
 * página e nunca vai para o `localStorage`.
 */
let recado: string | null = null;

export function deixarRecado(texto: string) {
  recado = texto;
}

/** Devolve o recado e o apaga: cada recado aparece uma vez só. */
export function pegarRecado(): string | null {
  const texto = recado;
  recado = null;
  return texto;
}
