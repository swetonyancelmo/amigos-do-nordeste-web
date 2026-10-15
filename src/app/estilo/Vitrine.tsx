'use client';

import { Toaster } from '@/componentes/ui/sonner';
import { SecaoBotoes, SecaoCampos } from './SecaoBotoesECampos';
import { SecaoComponentes } from './SecaoComponentes';
import { SecaoEstratos, SecaoPrimarioDestrutivo, SecaoTipografia, SecaoTokens } from './SecaoEstratosECores';

const INDICE = [
  ['estratos', 'Selos de estrato'],
  ['primario-destrutivo', 'Primário × destrutivo'],
  ['cores', 'Cores'],
  ['tipografia', 'Texto'],
  ['botoes', 'Botão'],
  ['campos', 'Campos'],
  ['dialogo', 'Diálogo'],
  ['tabela', 'Tabela'],
  ['badge', 'Badge'],
  ['abas', 'Abas'],
  ['card', 'Card'],
  ['aviso', 'Aviso'],
  ['paginacao', 'Paginação'],
  ['esqueleto', 'Esqueleto'],
  ['menu', 'Menu'],
  ['separador', 'Separador'],
  ['mapa', 'Mapa'],
] as const;

/*
 * `data-preflight` liga o reset do Tailwind nesta página inteira (ver
 * tailwind.css). É o mesmo atributo que cada tela vai ganhar ao migrar.
 */
export function Vitrine() {
  return (
    <div data-preflight className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-[0.8rem] font-bold tracking-wide text-primary uppercase">Amigos do Nordeste · interface nova</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Estilo</h1>
          <div className="mt-3 max-w-3xl space-y-2 text-muted-foreground">
            <p>
              Os componentes da interface nova (Tailwind + shadcn/ui, com os tokens da associação), em todos os
              estados. É aqui que o time aprova o visual <strong>antes</strong> de qualquer tela mudar.
            </p>
            <p>
              Tudo nesta página é exemplo inventado: nenhuma família, CPF ou telefone de verdade. A página não fala
              com o servidor.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Seções da página" className="border-b py-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {INDICE.map(([id, nome]) => (
              <li key={id}>
                <a href={`#${id}`} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                  {nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main>
          <SecaoEstratos />
          <SecaoPrimarioDestrutivo />
          <SecaoTokens />
          <SecaoTipografia />
          <SecaoBotoes />
          <SecaoCampos />
          <SecaoComponentes />
        </main>
      </div>

      <Toaster />
    </div>
  );
}
