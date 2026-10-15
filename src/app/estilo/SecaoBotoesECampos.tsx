'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { RadioGroup, RadioGroupItem } from '@/componentes/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Skeleton } from '@/componentes/ui/skeleton';
import { Textarea } from '@/componentes/ui/textarea';
import { LinhaDeEstados, NaoSeAplica, Secao } from './pecas';

/*
 * `data-demo-foco` liga as classes `focus-visible:` do componente sem foco de
 * verdade (ver tailwind.css). Só a /estilo usa.
 */
const FOCO = { 'data-demo-foco': '' };

const VARIANTES = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const;

/** "Carregando" de botão: fica desabilitado, avisa o leitor de tela e diz o que faz. */
function BotaoCarregando({ variante }: { variante: (typeof VARIANTES)[number] }) {
  return (
    <Button variant={variante} disabled aria-busy="true">
      <Loader2Icon className="animate-spin" aria-hidden="true" />
      Salvando…
    </Button>
  );
}

/** Esqueleto no lugar do campo enquanto as opções ou o valor chegam da API. */
function CampoCarregando({ altura = 'h-8' }: { altura?: string }) {
  return (
    <div role="status" className="w-full">
      <Skeleton className={`${altura} w-full`} />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

function Erro({ id, children }: { id: string; children: React.ReactNode }) {
  return <p id={id} className="text-[0.8rem] font-medium text-destructive">{children}</p>;
}

export function SecaoBotoes() {
  return (
    <Secao
      id="botoes"
      titulo="Botão"
      descricao={
        <p>
          Todas as variantes geradas, nos cinco estados. A coluna Foco mostra o anel que aparece ao
          chegar pelo teclado (Tab). Carregando = desabilitado com <code>aria-busy</code> e texto do que está acontecendo.
        </p>
      }
    >
      {VARIANTES.map((v) => (
        <LinhaDeEstados
          key={v}
          nome={`variant="${v}"`}
          estados={{
            Normal: <Button variant={v}>Salvar família</Button>,
            Foco: <Button variant={v} {...FOCO}>Salvar família</Button>,
            Erro: <Button variant={v} aria-invalid="true">Salvar família</Button>,
            Desabilitado: <Button variant={v} disabled>Salvar família</Button>,
            Carregando: <BotaoCarregando variante={v} />,
          }}
        />
      ))}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-bold">Tamanhos (size)</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button>default</Button>
          <Button size="lg">lg</Button>
          <Button size="icon" aria-label="Botão só com ícone (exemplo)"><Loader2Icon aria-hidden="true" /></Button>
        </div>
      </div>
    </Secao>
  );
}

export function SecaoCampos() {
  return (
    <Secao
      id="campos"
      titulo="Campos: input, textarea, select, checkbox, radio, label"
      descricao={
        <p>
          Todo campo tem <code>&lt;Label htmlFor&gt;</code> ligado ao id. O erro fica embaixo, ligado por{' '}
          <code>aria-describedby</code> e marcado com <code>aria-invalid</code>. Exemplos inventados.
        </p>
      }
    >
      <LinhaDeEstados
        nome="Input + Label"
        estados={{
          Normal: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="in-normal">Nome da responsável</Label>
              <Input id="in-normal" placeholder="Ex.: Maria Exemplo" />
            </div>
          ),
          Foco: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="in-foco">Nome da responsável</Label>
              <Input id="in-foco" defaultValue="Maria Exemplo" {...FOCO} />
            </div>
          ),
          Erro: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="in-erro">Nome da responsável</Label>
              <Input id="in-erro" aria-invalid="true" aria-describedby="in-erro-msg" />
              <Erro id="in-erro-msg">Informe o nome da responsável.</Erro>
            </div>
          ),
          Desabilitado: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="in-desab">Nome da responsável</Label>
              <Input id="in-desab" disabled defaultValue="Maria Exemplo" />
            </div>
          ),
          Carregando: (
            <div className="grid w-full gap-1.5">
              <Label>Nome da responsável</Label>
              <CampoCarregando />
            </div>
          ),
        }}
      />

      <LinhaDeEstados
        nome="Textarea"
        estados={{
          Normal: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tx-normal">Observações</Label>
              <Textarea id="tx-normal" placeholder="Algo que a associação precisa saber" />
            </div>
          ),
          Foco: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tx-foco">Observações</Label>
              <Textarea id="tx-foco" defaultValue="Texto de exemplo." {...FOCO} />
            </div>
          ),
          Erro: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tx-erro">Motivo da devolução</Label>
              <Textarea id="tx-erro" aria-invalid="true" aria-describedby="tx-erro-msg" />
              <Erro id="tx-erro-msg">Escreva o que a agente precisa corrigir.</Erro>
            </div>
          ),
          Desabilitado: (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tx-desab">Observações</Label>
              <Textarea id="tx-desab" disabled defaultValue="Texto de exemplo." />
            </div>
          ),
          Carregando: (
            <div className="grid w-full gap-1.5">
              <Label>Observações</Label>
              <CampoCarregando altura="h-16" />
            </div>
          ),
        }}
      />

      <LinhaDeEstados
        nome="Select"
        estados={{
          Normal: <SelectExemplo id="sel-normal" />,
          Foco: <SelectExemplo id="sel-foco" foco />,
          Erro: <SelectExemplo id="sel-erro" erro />,
          Desabilitado: <SelectExemplo id="sel-desab" desabilitado />,
          Carregando: (
            <div className="grid w-full gap-1.5">
              <Label>Comunidade</Label>
              <CampoCarregando />
            </div>
          ),
        }}
      />

      <LinhaDeEstados
        nome="Checkbox"
        estados={{
          Normal: <CheckboxExemplo id="ck-normal" />,
          Foco: <CheckboxExemplo id="ck-foco" foco />,
          Erro: <CheckboxExemplo id="ck-erro" erro />,
          Desabilitado: <CheckboxExemplo id="ck-desab" desabilitado />,
          Carregando: <CampoCarregando altura="h-5" />,
        }}
      />

      <LinhaDeEstados
        nome="Radio (radio-group)"
        estados={{
          Normal: <RadioExemplo id="rd-normal" />,
          Foco: <RadioExemplo id="rd-foco" foco />,
          Erro: <RadioExemplo id="rd-erro" erro />,
          Desabilitado: <RadioExemplo id="rd-desab" desabilitado />,
          Carregando: <CampoCarregando altura="h-12" />,
        }}
      />

      <LinhaDeEstados
        nome="Label sozinho"
        estados={{
          Normal: <Label htmlFor="in-normal">Rótulo de campo</Label>,
          Foco: <NaoSeAplica porque="o rótulo não recebe foco; clicar nele foca o campo" />,
          Erro: <NaoSeAplica porque="o erro é do campo, dito embaixo dele" />,
          Desabilitado: (
            <div className="flex items-center gap-2">
              <Checkbox id="lb-desab" disabled className="peer" />
              <Label htmlFor="lb-desab">Rótulo de campo desabilitado</Label>
            </div>
          ),
          Carregando: <NaoSeAplica porque="o rótulo vem pronto, só o campo espera" />,
        }}
      />
    </Secao>
  );
}

function SelectExemplo({ id, foco, erro, desabilitado }: {
  id: string; foco?: boolean; erro?: boolean; desabilitado?: boolean;
}) {
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={id}>Comunidade</Label>
      <Select disabled={desabilitado} defaultValue={foco || desabilitado ? 'a' : undefined}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={erro || undefined}
          aria-describedby={erro ? `${id}-msg` : undefined}
          {...(foco ? FOCO : {})}
        >
          <SelectValue placeholder="Escolha a comunidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Comunidade Exemplo A</SelectItem>
          <SelectItem value="b">Comunidade Exemplo B</SelectItem>
          <SelectItem value="c" disabled>Comunidade Exemplo C (indisponível)</SelectItem>
        </SelectContent>
      </Select>
      {erro && <Erro id={`${id}-msg`}>Escolha a comunidade da família.</Erro>}
    </div>
  );
}

function CheckboxExemplo({ id, foco, erro, desabilitado }: {
  id: string; foco?: boolean; erro?: boolean; desabilitado?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          defaultChecked={foco || desabilitado}
          disabled={desabilitado}
          aria-invalid={erro || undefined}
          aria-describedby={erro ? `${id}-msg` : undefined}
          {...(foco ? FOCO : {})}
        />
        <Label htmlFor={id}>Incluir inativas</Label>
      </div>
      {erro && <Erro id={`${id}-msg`}>Marque para continuar.</Erro>}
    </div>
  );
}

function RadioExemplo({ id, foco, erro, desabilitado }: {
  id: string; foco?: boolean; erro?: boolean; desabilitado?: boolean;
}) {
  return (
    <fieldset className="grid gap-2" aria-describedby={erro ? `${id}-msg` : undefined}>
      <legend className="mb-1 text-sm font-medium">Tem banheiro?</legend>
      <RadioGroup defaultValue={foco ? 'sim' : undefined} disabled={desabilitado} aria-invalid={erro || undefined}>
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value="sim"
            id={`${id}-sim`}
            aria-invalid={erro || undefined}
            {...(foco ? FOCO : {})}
          />
          <Label htmlFor={`${id}-sim`}>Sim</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nao" id={`${id}-nao`} aria-invalid={erro || undefined} />
          <Label htmlFor={`${id}-nao`}>Não</Label>
        </div>
      </RadioGroup>
      {erro && <Erro id={`${id}-msg`}>Responda, ou deixe “Não informado”.</Erro>}
    </fieldset>
  );
}
