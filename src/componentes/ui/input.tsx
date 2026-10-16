import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Escala do projeto (decidida antes da 1ª tela migrar): aqui 1rem = 15px,
 * então o tamanho padrão do shadcn saía com 30px de altura e fonte de 15px.
 * Campo tem 44px de altura e fonte de 16px SEMPRE, em px de propósito:
 * abaixo de 16px o Safari do iPhone dá zoom ao focar (o teste
 * camposQueDaoZoomNoIphone acusa). Não volte para text-base/md:text-sm.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-[16px] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
