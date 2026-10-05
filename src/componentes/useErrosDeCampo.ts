import { useCallback, useState } from 'react';

/** Um erro de validação, preso ao campo pelo `id` do elemento. */
export type ErroDeCampo = {
  id: string;
  /** Mostrada embaixo do campo. */
  mensagem: string;
  /** Linha do resumo no alerta, quando precisa de mais contexto que a mensagem. */
  resumo?: string;
};

/**
 * Padrão de erro de formulário (WCAG 3.3.1 e 3.3.3): cada erro aparece
 * embaixo do campo (passe `erroDe(id)` na prop `erro` de `Campo`/`Selecao`,
 * que liga `aria-invalid` e `aria-describedby`), o foco vai para o primeiro
 * campo inválido e o `<ResumoErros>` anuncia todos num `role="alert"`.
 *
 * O resumo só muda a cada `mostrar` (a cada tentativa de salvar); `limpar`
 * tira o erro de um campo assim que a pessoa mexe nele.
 */
export function useErrosDeCampo() {
  const [erros, setErros] = useState<ErroDeCampo[]>([]);
  const [resumo, setResumo] = useState<string[]>([]);

  /** Mostra os erros (na ordem da tela) e foca o primeiro. Devolve `true` se não há erro. */
  const mostrar = useCallback((lista: ErroDeCampo[]) => {
    setErros(lista);
    setResumo(lista.map((e) => e.resumo ?? e.mensagem));
    if (lista.length > 0) document.getElementById(lista[0].id)?.focus();
    return lista.length === 0;
  }, []);

  const limpar = useCallback((id: string) => {
    setErros((atual) => (atual.some((e) => e.id === id) ? atual.filter((e) => e.id !== id) : atual));
  }, []);

  const erroDe = (id: string) => erros.find((e) => e.id === id)?.mensagem;

  return { erroDe, resumo, mostrar, limpar };
}
