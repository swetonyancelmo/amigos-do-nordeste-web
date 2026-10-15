'use client';

import dynamic from 'next/dynamic';
import { MoreHorizontalIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/componentes/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/componentes/ui/pagination';
import { Separator } from '@/componentes/ui/separator';
import { Skeleton } from '@/componentes/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { SeloEstrato } from '@/componentes/ui/selo-estrato';
import { LinhaDeEstados, NaoSeAplica, Secao } from './pecas';

// Leaflet mexe em `window`: só no navegador (regra do projeto para mapa).
const MapaDemo = dynamic(() => import('./MapaDemo'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const FOCO = { 'data-demo-foco': '' };

/* Tudo inventado: nenhuma família, CPF ou telefone de verdade. */
const FAMILIAS = [
  { id: 'a', nome: 'Família Exemplo A', comunidade: 'Comunidade Exemplo', pessoas: 5, estrato: 'R3', rotulo: 'Maior necessidade de apoio' },
  { id: 'b', nome: 'Família Exemplo B', comunidade: 'Povoado Fictício', pessoas: 3, estrato: 'R1', rotulo: 'Necessidade a acompanhar' },
  { id: 'c', nome: 'Família Exemplo C', comunidade: 'Sítio de Teste', pessoas: 4, estrato: 'DADOS_INSUFICIENTES', rotulo: 'Cadastro a completar' },
];

function TabelaExemplo({ estado }: { estado: 'normal' | 'carregando' | 'vazia' | 'erro' }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableCaption className="sr-only">Famílias de exemplo</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Responsável</TableHead>
            <TableHead>Prioridade sugerida</TableHead>
            <TableHead>Comunidade</TableHead>
            <TableHead className="text-right">Pessoas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={estado === 'carregando' || undefined}>
          {estado === 'normal' && FAMILIAS.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium">{f.nome}</TableCell>
              <TableCell><SeloEstrato estrato={f.estrato} rotulo={f.rotulo} /></TableCell>
              <TableCell>{f.comunidade}</TableCell>
              <TableCell className="text-right tabular-nums">{f.pessoas}</TableCell>
            </TableRow>
          ))}
          {estado === 'carregando' && [0, 1, 2].map((i) => (
            <TableRow key={i}>
              {[0, 1, 2, 3].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
            </TableRow>
          ))}
          {estado === 'vazia' && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                Nenhuma família encontrada com esses filtros.
              </TableCell>
            </TableRow>
          )}
          {estado === 'erro' && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center">
                <span role="alert" className="font-medium text-destructive">Não foi possível carregar as famílias.</span>{' '}
                <Button variant="outline" size="sm">Tentar de novo</Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {estado === 'carregando' && <span role="status" className="sr-only">Carregando famílias</span>}
    </div>
  );
}

function PaginacaoExemplo({ desabilitada = false }: { desabilitada?: boolean }) {
  const desab = desabilitada ? { 'aria-disabled': true, tabIndex: -1, className: 'pointer-events-none opacity-50' } : {};
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#paginacao" aria-disabled tabIndex={-1} className="pointer-events-none opacity-50" /></PaginationItem>
        <PaginationItem><PaginationLink href="#paginacao" isActive>1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="#paginacao" {...desab}>2</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationLink href="#paginacao" {...desab}>9</PaginationLink></PaginationItem>
        <PaginationItem><PaginationNext href="#paginacao" {...desab} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function SecaoComponentes() {
  return (
    <>
      <Secao
        id="dialogo"
        titulo="Diálogo (dialog)"
        descricao={<p>Abra com o teclado: o foco entra no diálogo, Tab fica preso nele, Esc fecha e o foco volta ao botão que abriu.</p>}
      >
        <LinhaDeEstados
          nome="Dialog"
          estados={{
            Normal: (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline">Nova agente (exemplo)</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova agente</DialogTitle>
                    <DialogDescription>Exemplo da página de estilo. Nada é salvo.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-1.5">
                    <Label htmlFor="dlg-nome">Nome da agente</Label>
                    <Input id="dlg-nome" placeholder="Ex.: Agente Exemplo" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <DialogClose asChild><Button>Cadastrar</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            Foco: <Button variant="outline" {...FOCO}>Nova agente (exemplo)</Button>,
            Erro: (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline">Diálogo com erro</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova agente</DialogTitle>
                    <DialogDescription>Exemplo do erro dentro do diálogo.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-1.5">
                    <Label htmlFor="dlg-erro">Nome da agente</Label>
                    <Input id="dlg-erro" aria-invalid="true" aria-describedby="dlg-erro-msg" />
                    <p id="dlg-erro-msg" className="text-[0.8rem] font-medium text-destructive">Informe o nome da agente.</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            Desabilitado: <Button variant="outline" disabled>Nova agente (exemplo)</Button>,
            Carregando: (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline">Diálogo carregando</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ficha de exemplo</DialogTitle>
                    <DialogDescription>O conteúdo ainda está vindo do servidor.</DialogDescription>
                  </DialogHeader>
                  <div role="status" className="grid gap-2">
                    <Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" />
                    <span className="sr-only">Carregando a ficha</span>
                  </div>
                </DialogContent>
              </Dialog>
            ),
          }}
        />
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-bold">Confirmação destrutiva</h3>
          <Dialog>
            <DialogTrigger asChild><Button variant="destructive">Inativar família (exemplo)</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inativar a Família Exemplo A?</DialogTitle>
                <DialogDescription>
                  Ela sai das listas e dos relatórios, mas não é apagada: dá para reativar depois.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <DialogClose asChild><Button variant="destructive">Inativar</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Secao>

      <Secao id="tabela" titulo="Tabela (table)" descricao={<p>Os mesmos dados inventados, em cada estado da lista.</p>}>
        <div className="grid gap-6">
          {(['normal', 'carregando', 'vazia', 'erro'] as const).map((estado) => (
            <div key={estado} className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 font-bold capitalize">{estado}</h3>
              <TabelaExemplo estado={estado} />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Foco e desabilitado não se aplicam à tabela em si: o foco é de cada botão ou link dentro dela.
        </p>
      </Secao>

      <Secao id="badge" titulo="Badge" descricao={<p>Para marca curta (Inativa, Sem banheiro, Estuda). Estrato usa o selo próprio, acima.</p>}>
        <LinhaDeEstados
          nome="Variantes"
          estados={{
            Normal: (
              <>
                <Badge>default</Badge>
                <Badge variant="secondary">secondary</Badge>
                <Badge variant="outline">outline</Badge>
                <Badge variant="destructive">destructive</Badge>
                <Badge variant="ghost">ghost</Badge>
              </>
            ),
            Foco: (
              <Badge asChild variant="outline">
                <a href="#badge" {...FOCO}>badge como link</a>
              </Badge>
            ),
            Erro: <Badge variant="destructive">Possível duplicata</Badge>,
            Desabilitado: <NaoSeAplica porque="badge não é controle" />,
            Carregando: <Skeleton className="h-5 w-20 rounded-full" />,
          }}
        />
      </Secao>

      <Secao id="abas" titulo="Abas (tabs)">
        <LinhaDeEstados
          nome="Tabs"
          largo
          estados={{
            Normal: <AbasExemplo />,
            Foco: <AbasExemplo foco />,
            Erro: <NaoSeAplica porque="aba não valida nada" />,
            Desabilitado: <AbasExemplo desabilitada />,
            Carregando: <AbasExemplo carregando />,
          }}
        />
      </Secao>

      <Secao id="card" titulo="Card">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Famílias cadastradas</CardTitle>
              <CardDescription>Número de exemplo</CardDescription>
              <CardAction><Button variant="ghost" size="icon-sm" aria-label="Mais ações (exemplo)"><MoreHorizontalIcon /></Button></CardAction>
            </CardHeader>
            <CardContent><p className="font-heading text-4xl font-extrabold">123</p></CardContent>
            <CardFooter className="border-t pt-4 text-muted-foreground">Rodapé de exemplo</CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Carregando</CardTitle>
              <CardDescription>Servidor acordando</CardDescription>
            </CardHeader>
            <CardContent role="status" className="grid gap-2">
              <Skeleton className="h-10 w-24" />
              <span className="sr-only">Carregando</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Erro</CardTitle>
              <CardDescription role="alert" className="text-destructive">Não foi possível carregar.</CardDescription>
            </CardHeader>
            <CardContent><Button variant="outline" size="sm">Tentar de novo</Button></CardContent>
          </Card>
        </div>
      </Secao>

      <Secao
        id="aviso"
        titulo="Aviso passageiro (toast → sonner)"
        descricao={<p>O componente “toast” foi descontinuado pelo shadcn em favor do sonner. Clique para ver cada tom.</p>}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success('Família de exemplo salva.')}>Sucesso</Button>
          <Button variant="outline" onClick={() => toast.error('Não foi possível salvar o exemplo.')}>Erro</Button>
          <Button variant="outline" onClick={() => toast.warning('Cadastro de exemplo a completar.')}>Atenção</Button>
          <Button variant="outline" onClick={() => toast.info('Exemplo de informação.')}>Informação</Button>
          <Button
            variant="outline"
            onClick={() => {
              const id = toast.loading('Salvando o exemplo…');
              setTimeout(() => toast.success('Exemplo salvo.', { id }), 1500);
            }}
          >
            Carregando → sucesso
          </Button>
        </div>
      </Secao>

      <Secao id="paginacao" titulo="Paginação (pagination)">
        <LinhaDeEstados
          nome="Pagination"
          largo
          estados={{
            Normal: <PaginacaoExemplo />,
            Foco: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationLink href="#paginacao" isActive>1</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink href="#paginacao" {...FOCO}>2</PaginationLink></PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            Erro: <NaoSeAplica porque="paginação não valida nada" />,
            Desabilitado: <PaginacaoExemplo desabilitada />,
            Carregando: <Skeleton className="h-8 w-48" />,
          }}
        />
      </Secao>

      <Secao id="esqueleto" titulo="Esqueleto (skeleton)" descricao={<p>Sempre com texto para o leitor de tela; a API pode levar perto de um minuto para acordar.</p>}>
        <div role="status" className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <span className="sr-only">Carregando</span>
        </div>
      </Secao>

      <Secao id="menu" titulo="Menu (dropdown-menu)">
        <LinhaDeEstados
          nome="DropdownMenu"
          estados={{
            Normal: <MenuExemplo />,
            Foco: <MenuExemplo foco />,
            Erro: <NaoSeAplica porque="menu não valida nada; a ação que falha avisa depois" />,
            Desabilitado: <Button variant="outline" disabled>Ações</Button>,
            Carregando: <Button variant="outline" disabled aria-busy="true">Ações…</Button>,
          }}
        />
      </Secao>

      <Secao id="separador" titulo="Separador (separator)">
        <div className="rounded-xl border bg-card p-4">
          <p>Bloco de cima</p>
          <Separator className="my-4" />
          <div className="flex h-5 items-center gap-4 text-sm">
            <span>Famílias</span>
            <Separator orientation="vertical" />
            <span>Pessoas</span>
            <Separator orientation="vertical" />
            <span>Comunidades</span>
          </div>
        </div>
      </Secao>

      <Secao
        id="mapa"
        titulo="Mapa dentro da interface nova"
        descricao={
          <p>
            Prova da regra Leaflet × preflight do <code>tailwind.css</code>. Os quadrados do mapa têm que encaixar
            sem faixa vazia nem desalinho. Se aparecer picotado, alguém removeu a regra.
          </p>
        }
      >
        <MapaDemo />
      </Secao>
    </>
  );
}

function AbasExemplo({ foco, desabilitada, carregando }: { foco?: boolean; desabilitada?: boolean; carregando?: boolean }) {
  return (
    <Tabs defaultValue="esperando" className="w-full">
      <TabsList>
        <TabsTrigger value="esperando">Esperando</TabsTrigger>
        <TabsTrigger value="aprovados" {...(foco ? FOCO : {})}>Aprovados</TabsTrigger>
        <TabsTrigger value="devolvidos" disabled={desabilitada}>Devolvidos</TabsTrigger>
      </TabsList>
      <TabsContent value="esperando" className="pt-2">
        {carregando
          ? <div role="status"><Skeleton className="h-4 w-full" /><span className="sr-only">Carregando</span></div>
          : <p className="text-muted-foreground">Conteúdo de exemplo.</p>}
      </TabsContent>
      <TabsContent value="aprovados" className="pt-2"><p className="text-muted-foreground">Outra aba.</p></TabsContent>
      <TabsContent value="devolvidos" className="pt-2"><p className="text-muted-foreground">Mais uma.</p></TabsContent>
    </Tabs>
  );
}

function MenuExemplo({ foco }: { foco?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" {...(foco ? FOCO : {})}>Ações</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Família Exemplo A</DropdownMenuLabel>
        <DropdownMenuItem>Ver ficha</DropdownMenuItem>
        <DropdownMenuItem>Editar</DropdownMenuItem>
        <DropdownMenuItem disabled>Exportar (indisponível)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Inativar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
