/*
 * Tabela de lista na interface nova: o `Table` do shadcn (table.tsx) com
 * estas classes. Famílias foi a primeira; Comunidades, Pessoas, Priorização
 * e ComoECalculada repetem (achado C5 do diagnóstico).
 *
 * No desktop é tabela de verdade, com rolagem lateral SÓ dentro dela. No
 * celular (`celular:`, até 640px) cada linha vira um cartão: o cabeçalho sai
 * da tela mas fica para o leitor de tela, e cada célula mostra o próprio
 * rótulo, tirado do `data-rotulo` dela. Célula sem `data-rotulo` (o nome,
 * que já é o título do cartão) não ganha rótulo.
 *
 *   <div className={tabelaCartoes.moldura}>
 *     <Table className={tabelaCartoes.tabela}>
 *       <TableCaption className="sr-only">…</TableCaption>
 *       <TableHeader className={tabelaCartoes.cabecalho}>…<TableHead className={tabelaCartoes.cabeca}>
 *       <TableRow className={tabelaCartoes.linha}>
 *         <TableCell className={cn(tabelaCartoes.celula, tabelaCartoes.inteira)}>…
 *         <TableCell data-rotulo="Pessoas" className={cn(tabelaCartoes.celula, tabelaCartoes.numero)}>…
 *
 * Nada aqui ordena, filtra nem pagina: isso é da API.
 */
export const tabelaCartoes = {
  /** Cartão em volta da tabela: borda, fundo e cantos. */
  moldura: 'overflow-hidden rounded-lg border bg-card',
  /** Largura mínima no desktop (a rolagem fica dentro do `Table`); no celular, cabe na tela. */
  tabela: 'min-w-[820px] text-sm text-muted-foreground celular:min-w-0',
  /** Some da tela no celular, continua para o leitor de tela. */
  cabecalho: 'bg-muted/60 celular:sr-only',
  cabeca:
    'h-11 px-4 font-heading text-[0.8rem] font-extrabold tracking-wide text-muted-foreground uppercase',
  linha: [
    'cursor-pointer hover:bg-accent/40',
    'celular:grid celular:grid-cols-4 celular:gap-x-3 celular:gap-y-2 celular:p-4',
  ].join(' '),
  celula: [
    'px-4 py-3.5',
    'celular:block celular:p-0 celular:whitespace-normal celular:[overflow-wrap:anywhere]',
    'celular:data-rotulo:before:block celular:data-rotulo:before:content-[attr(data-rotulo)]',
    'celular:data-rotulo:before:text-[0.8rem] celular:data-rotulo:before:font-bold',
    'celular:data-rotulo:before:tracking-wide celular:data-rotulo:before:text-muted-foreground',
    'celular:data-rotulo:before:uppercase',
  ].join(' '),
  /** Coluna de número: centrada na tabela, alinhada à esquerda no cartão. */
  numero: 'text-center celular:text-left',
  /** Ocupa a largura toda do cartão (nome, selo, situação). */
  inteira: 'celular:col-span-full',
  /** Meia largura do cartão (comunidade, município). */
  meia: 'celular:col-span-2',
} as const;
