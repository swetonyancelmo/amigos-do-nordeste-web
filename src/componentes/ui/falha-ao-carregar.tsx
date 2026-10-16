import { RotateCwIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';

/*
 * Estado de erro na interface nova: o mesmo `FalhaAoCarregar` de
 * EstadoCarga.tsx (mesmos textos, mesmo role="alert"), desenhado com os
 * primitivos. O antigo continua nas telas não migradas; quando a última
 * migrar, ele sai e este fica.
 *
 * O par de toda tela que depende da API:
 *   - carregando: `Carregando` de EstadoCarga.tsx (depois de 5 s explica que
 *     o servidor está acordando; a primeira chamada leva perto de 1 minuto);
 *   - falhou: este, com a mensagem de `mensagemDeFalha` e o botão que tenta
 *     de novo. Nunca lista vazia em silêncio no lugar do erro.
 */
export function FalhaAoCarregar({ mensagem, onTentarDeNovo }: { mensagem: string; onTentarDeNovo: () => void }) {
  return (
    <div data-slot="falha-ao-carregar" className="grid justify-items-start gap-3">
      <div
        role="alert"
        className="w-full rounded-lg border border-l-4 border-destructive/25 border-l-destructive bg-destructive/5 p-4 text-sm"
      >
        <p className="text-[0.8rem] font-extrabold tracking-wide text-destructive uppercase">
          Não foi possível carregar
        </p>
        <p className="mt-1 leading-relaxed text-foreground">{mensagem}</p>
      </div>
      <Button type="button" variant="outline" onClick={onTentarDeNovo}>
        <RotateCwIcon aria-hidden="true" />
        Tentar de novo
      </Button>
    </div>
  );
}
