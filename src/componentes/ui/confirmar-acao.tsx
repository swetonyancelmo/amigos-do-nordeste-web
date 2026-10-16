'use client';

import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog';

/*
 * Confirmação de ação, no lugar do `window.confirm` (achados C3 e A6).
 *
 * O botão que abre é o `gatilho` (passado pronto, vira DialogTrigger): o
 * Radix prende o foco no diálogo, fecha com Esc e devolve o foco a ele.
 * "Cancelar" vem primeiro no Tab e é o foco inicial: Enter sem pensar não
 * apaga nada.
 *
 * `destrutivo` pinta o botão de confirmar com a variante tonal (fundo
 * carmim claro). Não o sólido: impresso ou em escala de cinza ele fica igual
 * ao primário. Quem diz o que acontece é o rótulo ("Inativar"), nunca a cor.
 *
 * `onConfirmar` pode ser assíncrona: enquanto roda, o botão fica ocupado; ao
 * terminar (com sucesso ou erro) o diálogo fecha e o foco volta ao gatilho.
 * O erro é de quem chamou mostrar, na tela de origem.
 */
type Props = {
  gatilho: React.ReactElement;
  titulo: string;
  descricao: React.ReactNode;
  rotuloConfirmar: string;
  destrutivo?: boolean;
  onConfirmar: () => Promise<void> | void;
};

export function ConfirmarAcao({ gatilho, titulo, descricao, rotuloConfirmar, destrutivo = false, onConfirmar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function confirmar() {
    setOcupado(true);
    try {
      await onConfirmar();
    } finally {
      setOcupado(false);
      setAberto(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !ocupado && setAberto(v)}>
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug font-extrabold">{titulo}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-6 -mb-6 px-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={ocupado}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={destrutivo ? 'destructive' : 'default'}
            onClick={confirmar}
            disabled={ocupado}
            aria-busy={ocupado || undefined}
          >
            {rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
