'use client';

import { Button } from '@/componentes/ui/button';
import { SeloEstrato } from '@/componentes/ui/selo-estrato';
import { Amostra, Secao, TamanhoMedido } from './pecas';

/*
 * Na tela de verdade o rótulo vem da API (e de metadados), nunca do código.
 * Aqui são os textos de exemplo pedidos para a aprovação.
 */
const ESTRATOS = [
  { estrato: 'R3', rotulo: 'Maior necessidade de apoio' },
  { estrato: 'R2', rotulo: 'Necessidade intermediária' },
  { estrato: 'R1', rotulo: 'Necessidade a acompanhar' },
  { estrato: 'DADOS_INSUFICIENTES', rotulo: 'Cadastro a completar' },
  { estrato: 'SEM_RISCO_IDENTIFICADO', rotulo: 'Sem prioridade indicada pela escala' },
];

function ColunaDeSelos({ titulo, cinza = false }: { titulo: string; cinza?: boolean }) {
  return (
    <div className="flex-1 rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-bold">{titulo}</h3>
      <ul className={cinza ? 'flex flex-col gap-3 grayscale' : 'flex flex-col gap-3'}>
        {ESTRATOS.map((e) => (
          <li key={e.estrato}>
            <SeloEstrato estrato={e.estrato} rotulo={e.rotulo} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SecaoEstratos() {
  return (
    <Secao
      id="estratos"
      titulo="Selos de estrato (prioridade sugerida)"
      descricao={
        <>
          <p>
            A cor nunca informa sozinha: cada selo tem texto, um ícone próprio (o mesmo de hoje) e borda
            diferente. A coluna da direita é a mesma coisa em escala de cinza, como sai na impressora da
            associação. <strong>Se dois selos ficarem iguais em cinza, o design falhou.</strong>
          </p>
          <p className="mt-2">
            “Cadastro a completar” é pendência que pede ação, não “sem risco”: fundo âmbar, borda tracejada e
            ícone de alerta.
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <ColunaDeSelos titulo="Colorido" />
        <ColunaDeSelos titulo="Escala de cinza (impressão)" cinza />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 font-bold">Como cada um se distingue sem cor</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><strong>Maior necessidade:</strong> fundo escuro preenchido, borda grossa, três barras cheias.</li>
          <li><strong>Intermediária:</strong> fundo claro, borda grossa, duas barras cheias.</li>
          <li><strong>A acompanhar:</strong> fundo claro, borda fina, uma barra cheia.</li>
          <li><strong>Cadastro a completar:</strong> borda grossa TRACEJADA, ícone “!”.</li>
          <li><strong>Sem prioridade:</strong> borda fina e clara, barras vazias.</li>
        </ul>
      </div>
    </Secao>
  );
}

export function SecaoPrimarioDestrutivo() {
  return (
    <Secao
      id="primario-destrutivo"
      titulo="Primário × destrutivo"
      descricao={
        <p>
          A cor da associação já é vermelha (terracota). O destrutivo é um carmim mais escuro e mais frio, de
          propósito, para excluir não parecer salvar. O estilo gerado (radix-nova) faz o destrutivo{' '}
          <strong>tonal</strong>: fundo carmim claro, texto carmim. Ao lado, uma proposta <strong>sólida</strong>{' '}
          com o <code>--destructive-foreground</code> dos tokens, que o componente gerado não usa. Decisão do time.
        </p>
      }
    >
      {[false, true].map((cinza) => (
        <div key={String(cinza)} className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-bold">{cinza ? 'Em escala de cinza' : 'Colorido'}</h3>
          <div className={cinza ? 'flex flex-wrap items-center gap-3 grayscale' : 'flex flex-wrap items-center gap-3'}>
            <Button>Aprovar e criar família</Button>
            <Button variant="destructive">Inativar família (gerado, tonal)</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Inativar família (proposta sólida)
            </Button>
          </div>
        </div>
      ))}
    </Secao>
  );
}

const TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'success', 'success-foreground',
  'warning', 'warning-foreground', 'border', 'input', 'ring',
  'estrato-r3-bg', 'estrato-r3-fg', 'estrato-r3-border', 'estrato-r2-bg', 'estrato-r2-fg', 'estrato-r2-border',
  'estrato-r1-bg', 'estrato-r1-fg', 'estrato-r1-border', 'estrato-pendente-bg', 'estrato-pendente-fg',
  'estrato-pendente-border', 'estrato-sem-bg', 'estrato-sem-fg', 'estrato-sem-border',
];

export function SecaoTokens() {
  return (
    <Secao
      id="cores"
      titulo="Cores (tokens)"
      descricao={
        <p>
          Os valores estão em OKLCH no código. O HEX embaixo de cada amostra é medido aqui no navegador: tem que
          ser igual ao HEX do comentário em <code>tokens-amigos-do-nordeste.css</code> e ao do arquivo do Paper.
        </p>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOKENS.map((t) => <Amostra key={t} token={t} />)}
      </div>
    </Secao>
  );
}

export function SecaoTipografia() {
  return (
    <Secao
      id="tipografia"
      titulo="Texto"
      descricao={
        <p>
          Atenção: o painel usa 15px como base no <code>&lt;html&gt;</code>, então aqui 1rem = 15px e as
          classes do Tailwind saem 6% menores que o padrão. O tamanho medido está ao lado de cada uma.
        </p>
      }
    >
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <TamanhoMedido classe="text-xs">Texto de apoio de exemplo</TamanhoMedido>
        <TamanhoMedido classe="text-sm">Texto de exemplo em tabela e campo</TamanhoMedido>
        <TamanhoMedido classe="text-base">Texto corrido de exemplo</TamanhoMedido>
        <TamanhoMedido classe="text-lg">Subtítulo de exemplo</TamanhoMedido>
        <TamanhoMedido classe="text-2xl">
          <span className="font-heading font-extrabold">Título na fonte da marca</span>
        </TamanhoMedido>
      </div>
    </Secao>
  );
}
