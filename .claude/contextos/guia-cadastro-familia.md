# Guia — Página de Cadastro de Família (`/familias/novo`) · Amigos do Nordeste

Mesmo formato dos guias anteriores: cada capítulo explica **o que fazer** e **por quê**, antes
do código. Duas diferenças em relação aos guias da Tela de Relatórios valem aviso logo de cara —
veja o Capítulo 0.

---

## Capítulo 0 — O que essa tela cadastra, e duas ressalvas importantes

**Primeira ressalva:** desta vez não veio nenhum print de Figma junto com o pedido — só o corpo
JSON do endpoint. Este guia segue o mesmo padrão visual dos guias anteriores (o
`design-system.html` de vocês) e a mesma arquitetura de pastas já validada com o time, mas a
**disposição exata dos campos na tela** (o que fica em qual seção, em que ordem) é uma proposta
organizada por mim a partir do JSON, não uma cópia de um layout que eu tenha visto. Se o Figma
desta tela chegar depois, comparem com a seção 3 (estrutura de arquivos) e ajustem só o
agrupamento visual — os tipos, o reducer e a lógica de cascata do IBGE não mudam.

**Segunda ressalva:** o nome "cadastro de pessoa" e o corpo do endpoint contam duas histórias
ligeiramente diferentes. O que o endpoint recebe é uma **família inteira**: um responsável, os
dados de moradia da casa, uma lista de **pessoas** (todos os moradores, o responsável incluído) e
uma lista de **fontes de renda** (que apontam para qual pessoa da lista recebe cada uma). Trato a
tela como "cadastro de família" no resto do guia — é mais preciso, e evita a armadilha de montar
uma tela para uma pessoa só e descobrir depois que faltou o array inteiro de moradores.

O endpoint que teremos que alimentar:

```json
{
  "comunidadeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "responsavelNome": "string",
  "responsavelCpf": "",
  "telefone": "string",
  "pontoReferencia": "string",
  "temBanheiro": true,
  "escoamentoSanitario": "FOSSA_RUDIMENTAR",
  "tratamentoAgua": "SEM_TRATAMENTO",
  "abastecimentoAgua": ["REDE_PUBLICA"],
  "pessoas": [
    {
      "nome": "string",
      "cadastroIncompleto": true,
      "sexo": "FEMININO",
      "dataNascimento": "2026-09-15",
      "idadeEstimada": 0,
      "idadeEstimadaEm": "2026-09-15",
      "parentesco": "RESPONSAVEL",
      "estuda": true,
      "serie": "PRE",
      "tamanhoRoupa": "RN",
      "numeroCalcado": "string",
      "gestante": true,
      "observacoes": "string"
    }
  ],
  "fontesRenda": [
    { "tipo": "BOLSA_FAMILIA", "pessoaIndice": 0, "faixa": "SEM_RENDA_FIXA", "observacao": "string" }
  ],
  "observacoes": "string"
}
```

E a peça nova que este guia resolve, que a tela de Relatórios não tinha: **encontrar o
`comunidadeId`** a partir de uma cascata Estado → Município (API pública do IBGE) → Comunidade
(cadastro interno de vocês, filtrado pelo município escolhido).

---

## Capítulo 1 — Contrato com o backend

Dois pontos de conversa com o backend, além do `POST` que já veio pronto no pedido:

**`POST /familias`** — o corpo é exatamente o JSON do Capítulo 0. Sem confirmação pendente aqui.

**`GET /comunidades?codigoIbge={codigo}`** — proposta deste guia, ainda não confirmada: devolve
as comunidades **já cadastradas** naquele município, para popular o terceiro select da cascata.

```json
[
  { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "nome": "Jeritacó" },
  { "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "nome": "Mulungu" }
]
```

**Os valores possíveis de cada enum** — o JSON do pedido só mostra um exemplo de cada campo
(`"FOSSA_RUDIMENTAR"`, `"SEM_TRATAMENTO"` etc.), não a lista inteira de opções. Os valores usados
neste guia (tabela abaixo) são **presumidos** a partir do vocabulário comum de cadastro social
brasileiro (o mesmo tipo de campo existe no CadÚnico) — **a lista completa e os nomes exatos
precisam ser confirmados com o backend antes de fechar os `<select>`** da tela.

| Campo | Valores presumidos |
|---|---|
| `sexo` | `MASCULINO`, `FEMININO` |
| `parentesco` | `RESPONSAVEL`, `CONJUGE`, `FILHO`, `FILHA`, `ENTEADO`, `ENTEADA`, `NETO`, `NETA`, `IRMAO`, `IRMA`, `PAI`, `MAE`, `OUTRO_PARENTE`, `AGREGADO` |
| `serie` | `CRECHE`, `PRE`, `FUNDAMENTAL_1`, `FUNDAMENTAL_2`, `MEDIO`, `EJA`, `SUPERIOR`, `NAO_SE_APLICA` |
| `tamanhoRoupa` | `RN`, `P`, `M`, `G`, `GG` |
| `escoamentoSanitario` | `REDE_GERAL`, `FOSSA_SEPTICA`, `FOSSA_RUDIMENTAR`, `VALA`, `RIO_OU_MAR`, `NAO_TEM`, `OUTRO` |
| `tratamentoAgua` | `FERVURA`, `FILTRACAO`, `CLORACAO`, `SEM_TRATAMENTO`, `OUTRO` |
| `abastecimentoAgua` (array) | `REDE_PUBLICA`, `POCO_OU_NASCENTE`, `CISTERNA`, `CARRO_PIPA`, `RIO_ACUDE_OU_LAGO`, `OUTRO` |
| `fontesRenda[].tipo` | `BOLSA_FAMILIA`, `BPC`, `APOSENTADORIA`, `PENSAO`, `TRABALHO_FORMAL`, `TRABALHO_INFORMAL`, `OUTRO` |
| `fontesRenda[].faixa` | `SEM_RENDA_FIXA`, `ATE_MEIO_SALARIO`, `MEIO_A_UM_SALARIO`, `UM_A_DOIS_SALARIOS`, `ACIMA_DE_DOIS_SALARIOS` |

---

## Capítulo 2 — Tipos (`src/tipos/dominio.ts`)

Acrescentar ao arquivo que já existe — não recriar:

```ts
export type Sexo = 'MASCULINO' | 'FEMININO';

export type Parentesco =
  | 'RESPONSAVEL' | 'CONJUGE' | 'FILHO' | 'FILHA' | 'ENTEADO' | 'ENTEADA'
  | 'NETO' | 'NETA' | 'IRMAO' | 'IRMA' | 'PAI' | 'MAE' | 'OUTRO_PARENTE' | 'AGREGADO'; // presumi

export type Serie =
  | 'CRECHE' | 'PRE' | 'FUNDAMENTAL_1' | 'FUNDAMENTAL_2' | 'MEDIO' | 'EJA' | 'SUPERIOR' | 'NAO_SE_APLICA'; // presumi

export type TamanhoRoupa = 'RN' | 'P' | 'M' | 'G' | 'GG'; // presumi

export type EscoamentoSanitario =
  | 'REDE_GERAL' | 'FOSSA_SEPTICA' | 'FOSSA_RUDIMENTAR' | 'VALA' | 'RIO_OU_MAR' | 'NAO_TEM' | 'OUTRO'; // presumi

export type TratamentoAgua = 'FERVURA' | 'FILTRACAO' | 'CLORACAO' | 'SEM_TRATAMENTO' | 'OUTRO'; // presumi

export type AbastecimentoAgua =
  | 'REDE_PUBLICA' | 'POCO_OU_NASCENTE' | 'CISTERNA' | 'CARRO_PIPA' | 'RIO_ACUDE_OU_LAGO' | 'OUTRO'; // presumi

export type TipoFonteRenda =
  | 'BOLSA_FAMILIA' | 'BPC' | 'APOSENTADORIA' | 'PENSAO' | 'TRABALHO_FORMAL' | 'TRABALHO_INFORMAL' | 'OUTRO'; // presumi

export type FaixaRenda =
  | 'SEM_RENDA_FIXA' | 'ATE_MEIO_SALARIO' | 'MEIO_A_UM_SALARIO' | 'UM_A_DOIS_SALARIOS' | 'ACIMA_DE_DOIS_SALARIOS'; // presumi

export interface Pessoa {
  nome: string;
  cadastroIncompleto: boolean;
  sexo: Sexo;
  dataNascimento: string | null;   // "aaaa-mm-dd" — null quando só se sabe a idade estimada
  idadeEstimada: number | null;
  idadeEstimadaEm: string | null;  // data em que a idade estimada foi anotada
  parentesco: Parentesco;
  estuda: boolean;
  serie: Serie | null;
  tamanhoRoupa: TamanhoRoupa | null;
  numeroCalcado: string;
  gestante: boolean;
  observacoes: string;
}

export interface FonteRenda {
  tipo: TipoFonteRenda;
  pessoaIndice: number;   // posição dentro de NovaFamilia.pessoas — ver a armadilha no Capítulo 7
  faixa: FaixaRenda;
  observacao: string;
}

export interface NovaFamilia {
  comunidadeId: string;
  responsavelNome: string;
  responsavelCpf: string;
  telefone: string;
  pontoReferencia: string;
  temBanheiro: boolean;
  escoamentoSanitario: EscoamentoSanitario;
  tratamentoAgua: TratamentoAgua;
  abastecimentoAgua: AbastecimentoAgua[];
  pessoas: Pessoa[];
  fontesRenda: FonteRenda[];
  observacoes: string;
}

export interface ComunidadeOpcao {
  id: string;
  nome: string;
}
```

---

## Capítulo 3 — Onde cada arquivo mora

```
src/
  app/(app)/familias/novo/
    page.tsx                          ← server, só monta o formulário

  componentes/
    ui/
      Cartao.tsx                      ← já existe (guia de Relatórios) — reaproveitado aqui
      Campo.tsx                       ← rótulo + input/select + erro/dica
      Chip.tsx                        ← seleção múltipla (abastecimentoAgua)
      RadioOpt.tsx                    ← escolha única em poucas opções (sexo)
      Switch.tsx                      ← liga/desliga (temBanheiro, estuda, gestante)
    familias/
      FormularioFamilia.tsx           ← client, o "cérebro": useReducer + composição
      formularioReducer.ts            ← estado + ações do formulário inteiro
      SelecaoLocalizacao.tsx          ← cascata Estado → Município → Comunidade
      SecaoResponsavel.tsx
      SecaoMoradia.tsx
      SecaoMembros.tsx                ← lista de pessoas[]
      SecaoFontesRenda.tsx            ← lista de fontesRenda[]

  lib/
    ibge.ts                           ← já existe — acrescentar buscarEstados/buscarMunicipiosPorEstado
    familias.ts                       ← criarFamilia() e buscarComunidadesPorMunicipio()

  tipos/
    dominio.ts                        ← já existe — acrescentar os tipos do Capítulo 2
```

---

## Capítulo 4 — A cascata Estado → Município → Comunidade

Dois tipos de dado, duas origens diferentes — misturar as duas é o erro mais fácil de cometer
aqui:

- **Estado e Município** vêm da **API pública do IBGE** (a mesma família de API da malha
  municipal, só que o recorte de localidades, não de geometria). São públicos, sem chave, e —
  assim como a malha — mudam tão raramente que cabe o mesmo cache agressivo do `lib/ibge.ts` que
  vocês já têm.
- **Comunidade** vem do **backend de vocês** — é o cadastro próprio da associação, filtrado pelo
  `codigoIbge` do município escolhido. O IBGE nunca ouviu falar da comunidade "Jeritacó".

Acrescente ao `src/lib/ibge.ts` que já existe:

```ts
export interface EstadoIbge { id: number; sigla: string; nome: string; }
export interface MunicipioIbge { id: number; nome: string; }

let estadosEmMemoria: EstadoIbge[] | null = null;
const municipiosEmMemoria = new Map<string, MunicipioIbge[]>();

export async function buscarEstados(sinal?: AbortSignal): Promise<EstadoIbge[]> {
  if (estadosEmMemoria) return estadosEmMemoria;

  const daSessao = lerListaDaSessao<EstadoIbge[]>('ibge:estados');
  if (daSessao) {
    estadosEmMemoria = daSessao;
    return daSessao;
  }

  const resposta = await fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
    { signal: sinal },
  );
  if (!resposta.ok) throw new Error('Não foi possível carregar os estados do IBGE');

  const estados = (await resposta.json()) as EstadoIbge[];
  estadosEmMemoria = estados;
  gravarListaNaSessao('ibge:estados', estados);
  return estados;
}

export async function buscarMunicipiosPorEstado(uf: string, sinal?: AbortSignal): Promise<MunicipioIbge[]> {
  if (!uf) return [];
  if (municipiosEmMemoria.has(uf)) return municipiosEmMemoria.get(uf)!;

  const chave = `ibge:municipios:${uf}`;
  const daSessao = lerListaDaSessao<MunicipioIbge[]>(chave);
  if (daSessao) {
    municipiosEmMemoria.set(uf, daSessao);
    return daSessao;
  }

  const resposta = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
    { signal: sinal },
  );
  if (!resposta.ok) throw new Error('Não foi possível carregar os municípios do IBGE');

  const municipios = (await resposta.json()) as MunicipioIbge[];
  municipiosEmMemoria.set(uf, municipios);
  gravarListaNaSessao(chave, municipios);
  return municipios;
}

function lerListaDaSessao<T>(chave: string): T | null {
  try {
    const bruto = sessionStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function gravarListaNaSessao(chave: string, valor: unknown) {
  try {
    sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // sessionStorage cheio: o cache em memória continua valendo
  }
}
```

Uma diferença proposital em relação a `buscarMalhaMunicipio()`: lá, o IBGE fora do ar só tira o
contorno do mapa — um acabamento visual, então a função engolia o erro e devolvia `null` em
silêncio. **Aqui não** — sem a lista de estados ou municípios, a pessoa **não consegue preencher
o formulário de jeito nenhum**. Por isso estas duas funções lançam a exceção adiante, e é o
componente que a chama (Capítulo 8) quem decide mostrar um aviso com botão de tentar de novo.

```ts
// src/lib/familias.ts
import { api } from '@/lib/api'; // confira a assinatura real
import type { NovaFamilia, ComunidadeOpcao } from '@/tipos/dominio';

export async function buscarComunidadesPorMunicipio(codigoIbge: string): Promise<ComunidadeOpcao[]> {
  return api.get<ComunidadeOpcao[]>(`/comunidades?codigoIbge=${codigoIbge}`);
}

export async function criarFamilia(dados: NovaFamilia): Promise<void> {
  await api.post('/familias', dados);
}
```

---

## Capítulo 5 — Peças de campo reaproveitáveis do design system

O catálogo já define o visual de quatro coisas que este formulário usa o tempo todo: campo com
rótulo (`.field`), seleção múltipla em forma de etiqueta (`.chip`), escolha única em poucas
opções (`.radio-opt`) e liga/desliga (`.switch`). Cada um vira um componente pequeno, para não
repetir a marcação toda vez que um campo desses aparece.

```tsx
// src/componentes/ui/Campo.tsx
type Props = {
  label: string;
  dica?: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
};

export default function Campo({ label, dica, erro, className = '', children }: Props) {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-ink-500">{dica}</p>}
      {erro && <p className="mt-1 text-xs font-medium text-danger-700">{erro}</p>}
    </div>
  );
}

// classe reaproveitada em todo input/select/textarea do formulário —
// mesma cor de borda, foco e estado desabilitado que o catálogo define para `.input`
export const ENTRADA =
  'w-full rounded-sm border-[1.5px] border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 ' +
  'focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/20 ' +
  'disabled:bg-ink-100 disabled:text-ink-500';
```

```tsx
// src/componentes/ui/Chip.tsx
type Props = { rotulo: string; marcado: boolean; onToggle: () => void };

export default function Chip({ rotulo, marcado, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium ${
        marcado ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-ink-300 bg-white text-ink-700'
      }`}
    >
      <span
        className={`flex h-[15px] w-[15px] items-center justify-center rounded border text-[10px] ${
          marcado ? 'border-primary-700 bg-primary-700 text-white' : 'border-ink-300'
        }`}
      >
        {marcado && '✓'}
      </span>
      {rotulo}
    </button>
  );
}
```

```tsx
// src/componentes/ui/RadioOpt.tsx
type Props = { rotulo: string; selecionado: boolean; onSelecionar: () => void };

export default function RadioOpt({ rotulo, selecionado, onSelecionar }: Props) {
  return (
    <button
      type="button"
      onClick={onSelecionar}
      className={`flex items-center gap-2 rounded-sm border-[1.5px] px-4 py-2.5 text-sm font-medium ${
        selecionado ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-ink-300 text-ink-700'
      }`}
    >
      <span className={`relative h-4 w-4 rounded-full border-[1.5px] ${selecionado ? 'border-primary-700' : 'border-ink-300'}`}>
        {selecionado && <span className="absolute inset-[3px] rounded-full bg-primary-700" />}
      </span>
      {rotulo}
    </button>
  );
}
```

```tsx
// src/componentes/ui/Switch.tsx
type Props = { rotulo: string; ligado: boolean; onToggle: () => void };

export default function Switch({ rotulo, ligado, onToggle }: Props) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3">
      <span className={`relative h-6 w-[42px] rounded-full transition-colors ${ligado ? 'bg-green-700' : 'bg-ink-300'}`}>
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all ${
            ligado ? 'left-[21px]' : 'left-[3px]'
          }`}
        />
      </span>
      <span className="text-sm font-medium text-ink-700">{rotulo}</span>
    </button>
  );
}
```

Regra de uso, para não escolher o componente errado na hora de montar cada campo: **`Chip`** para
campos que são **array** (a pessoa pode marcar mais de um — só `abastecimentoAgua` neste
formulário); **`RadioOpt`** para escolha única entre poucas opções lado a lado (`sexo`);
**`<select>`** comum, com a classe `ENTRADA`, para escolha única entre muitas opções
(`parentesco`, `serie`, `escoamentoSanitario`...); **`Switch`** só para campo que é
`boolean` de verdade (`temBanheiro`, `estuda`, `gestante`).

---

## Capítulo 6 — Por que `useReducer`, e não uma pilha de `useState`

Este formulário tem um `useState` óbvio para cada campo simples, mas também dois **arrays de
objetos** (`pessoas`, `fontesRenda`) onde adicionar, remover e editar um item precisa, às vezes,
alterar **outro** pedaço do estado ao mesmo tempo:

- editar o nome da primeira pessoa (o responsável) também precisa atualizar `responsavelNome`;
- remover uma pessoa do meio da lista precisa ajustar o `pessoaIndice` de toda fonte de renda que
  vinha depois dela na lista (Capítulo 7).

Com `useState` solto, essas duas sincronizações viram efeitos colaterais espalhados pelo
componente — fácil esquecer um dos dois lugares quando alguém mexer no código daqui a três
meses. Com `useReducer`, cada mudança de estado passa por **uma função só**, e a sincronização
vira parte da própria transição de estado, não uma manutenção manual em cada lugar que chama
`setState`.

---

## Capítulo 7 — O reducer completo

```ts
// src/componentes/familias/formularioReducer.ts
import type { NovaFamilia, Pessoa, FonteRenda } from '@/tipos/dominio';

export type Acao =
  | { type: 'CAMPO'; campo: keyof NovaFamilia; valor: any }
  | { type: 'ABASTECIMENTO_TOGGLE'; valor: NovaFamilia['abastecimentoAgua'][number] }
  | { type: 'PESSOA_ADICIONAR' }
  | { type: 'PESSOA_REMOVER'; indice: number }
  | { type: 'PESSOA_CAMPO'; indice: number; campo: keyof Pessoa; valor: any }
  | { type: 'FONTE_RENDA_ADICIONAR' }
  | { type: 'FONTE_RENDA_REMOVER'; indice: number }
  | { type: 'FONTE_RENDA_CAMPO'; indice: number; campo: keyof FonteRenda; valor: any };

function pessoaVazia(): Pessoa {
  return {
    nome: '', cadastroIncompleto: true, sexo: 'FEMININO', dataNascimento: null,
    idadeEstimada: null, idadeEstimadaEm: null, parentesco: 'FILHO', estuda: false,
    serie: null, tamanhoRoupa: null, numeroCalcado: '', gestante: false, observacoes: '',
  };
}

function fonteRendaVazia(): FonteRenda {
  return { tipo: 'BOLSA_FAMILIA', pessoaIndice: 0, faixa: 'SEM_RENDA_FIXA', observacao: '' };
}

export function estadoInicial(): NovaFamilia {
  return {
    comunidadeId: '', responsavelNome: '', responsavelCpf: '', telefone: '', pontoReferencia: '',
    temBanheiro: true, escoamentoSanitario: 'FOSSA_RUDIMENTAR', tratamentoAgua: 'SEM_TRATAMENTO',
    abastecimentoAgua: [], observacoes: '',
    pessoas: [{ ...pessoaVazia(), parentesco: 'RESPONSAVEL', cadastroIncompleto: true }],
    fontesRenda: [],
  };
}

export function reducer(estado: NovaFamilia, acao: Acao): NovaFamilia {
  switch (acao.type) {
    case 'CAMPO': {
      const novo = { ...estado, [acao.campo]: acao.valor };
      // o nome do responsável é o mesmo nome da pessoa de índice 0 — uma fonte de verdade só
      if (acao.campo === 'responsavelNome') {
        novo.pessoas = novo.pessoas.map((p, i) => (i === 0 ? { ...p, nome: acao.valor } : p));
      }
      return novo;
    }

    case 'ABASTECIMENTO_TOGGLE': {
      const jaTem = estado.abastecimentoAgua.includes(acao.valor);
      return {
        ...estado,
        abastecimentoAgua: jaTem
          ? estado.abastecimentoAgua.filter((v) => v !== acao.valor)
          : [...estado.abastecimentoAgua, acao.valor],
      };
    }

    case 'PESSOA_ADICIONAR':
      return { ...estado, pessoas: [...estado.pessoas, pessoaVazia()] };

    case 'PESSOA_REMOVER': {
      if (acao.indice === 0) return estado; // o responsável não se remove por aqui
      return {
        ...estado,
        pessoas: estado.pessoas.filter((_, i) => i !== acao.indice),
        // ARMADILHA: fontesRenda.pessoaIndice aponta pra posição na lista, não pra um id.
        // Remover uma pessoa do meio desloca todo mundo depois dela — sem este ajuste,
        // uma fonte de renda passa a apontar pra pessoa errada em silêncio.
        fontesRenda: estado.fontesRenda
          .filter((f) => f.pessoaIndice !== acao.indice)
          .map((f) => (f.pessoaIndice > acao.indice ? { ...f, pessoaIndice: f.pessoaIndice - 1 } : f)),
      };
    }

    case 'PESSOA_CAMPO': {
      const pessoas = estado.pessoas.map((p, i) => {
        if (i !== acao.indice) return p;
        const atualizada = { ...p, [acao.campo]: acao.valor };

        // sexo masculino não pode carregar "gestante" pendurado de uma escolha anterior
        if (acao.campo === 'sexo' && acao.valor === 'MASCULINO') atualizada.gestante = false;

        // "cadastroIncompleto" é derivado, nunca digitado — ver Capítulo 13
        atualizada.cadastroIncompleto = !atualizada.nome.trim();

        return atualizada;
      });

      const novo = { ...estado, pessoas };
      if (acao.indice === 0 && acao.campo === 'nome') novo.responsavelNome = acao.valor;
      return novo;
    }

    case 'FONTE_RENDA_ADICIONAR':
      return { ...estado, fontesRenda: [...estado.fontesRenda, fonteRendaVazia()] };

    case 'FONTE_RENDA_REMOVER':
      return { ...estado, fontesRenda: estado.fontesRenda.filter((_, i) => i !== acao.indice) };

    case 'FONTE_RENDA_CAMPO':
      return {
        ...estado,
        fontesRenda: estado.fontesRenda.map((f, i) => (i === acao.indice ? { ...f, [acao.campo]: acao.valor } : f)),
      };

    default:
      return estado;
  }
}
```

A guarda `if (acao.indice === 0) return estado;` em `PESSOA_REMOVER` é a segunda linha de defesa
— a primeira é nem mostrar o botão "Remover" para a pessoa de índice 0 na interface (Capítulo 11).
As duas junstas garantem o mesmo tipo de invariante que os guias anteriores já defendiam para o
código do IBGE: **a regra de negócio vive num lugar só, não depende de quem lembrar de checar**.

---

## Capítulo 8 — Seção Localização (a cascata)

```tsx
// src/componentes/familias/SelecaoLocalizacao.tsx
'use client';

import { useEffect, useState } from 'react';
import { buscarEstados, buscarMunicipiosPorEstado, type EstadoIbge, type MunicipioIbge } from '@/lib/ibge';
import { buscarComunidadesPorMunicipio } from '@/lib/familias';
import type { ComunidadeOpcao } from '@/tipos/dominio';
import Campo, { ENTRADA } from '@/componentes/ui/Campo';

type Props = { comunidadeId: string; onComunidadeChange: (id: string) => void };
type Carregando = 'estados' | 'municipios' | 'comunidades' | null;

export default function SelecaoLocalizacao({ comunidadeId, onComunidadeChange }: Props) {
  const [estados, setEstados] = useState<EstadoIbge[]>([]);
  const [uf, setUf] = useState('');
  const [municipios, setMunicipios] = useState<MunicipioIbge[]>([]);
  const [municipioId, setMunicipioId] = useState('');
  const [comunidades, setComunidades] = useState<ComunidadeOpcao[]>([]);
  const [carregando, setCarregando] = useState<Carregando>('estados');
  const [erro, setErro] = useState<string | null>(null);

  function carregarEstados() {
    setCarregando('estados');
    setErro(null);
    buscarEstados()
      .then(setEstados)
      .catch(() => setErro('Não foi possível carregar os estados.'))
      .finally(() => setCarregando(null));
  }

  useEffect(carregarEstados, []);

  function selecionarUf(novaUf: string) {
    setUf(novaUf);
    setMunicipioId('');
    setMunicipios([]);
    setComunidades([]);
    onComunidadeChange('');
    if (!novaUf) return;

    setCarregando('municipios');
    setErro(null);
    buscarMunicipiosPorEstado(novaUf)
      .then(setMunicipios)
      .catch(() => setErro('Não foi possível carregar os municípios.'))
      .finally(() => setCarregando(null));
  }

  function selecionarMunicipio(novoId: string) {
    setMunicipioId(novoId);
    setComunidades([]);
    onComunidadeChange('');
    if (!novoId) return;

    setCarregando('comunidades');
    setErro(null);
    buscarComunidadesPorMunicipio(novoId)
      .then(setComunidades)
      .catch(() => setErro('Não foi possível carregar as comunidades.'))
      .finally(() => setCarregando(null));
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Estado" className="mb-0">
          <select className={ENTRADA} value={uf} onChange={(e) => selecionarUf(e.target.value)} disabled={carregando === 'estados'}>
            <option value="">{carregando === 'estados' ? 'Carregando…' : 'Selecione'}</option>
            {estados.map((e) => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
          </select>
        </Campo>

        <Campo label="Município" className="mb-0">
          <select
            className={ENTRADA}
            value={municipioId}
            onChange={(e) => selecionarMunicipio(e.target.value)}
            disabled={!uf || carregando === 'municipios'}
          >
            <option value="">{carregando === 'municipios' ? 'Carregando…' : 'Selecione'}</option>
            {municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </Campo>

        <Campo label="Comunidade" className="mb-0">
          <select
            className={ENTRADA}
            value={comunidadeId}
            onChange={(e) => onComunidadeChange(e.target.value)}
            disabled={!municipioId || carregando === 'comunidades'}
          >
            <option value="">{carregando === 'comunidades' ? 'Carregando…' : 'Selecione'}</option>
            {comunidades.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Campo>
      </div>

      {erro && (
        <div className="mt-3 flex items-center gap-3 rounded-md bg-danger-50 p-3 text-sm text-danger-800">
          <span>{erro}</span>
          <button
            type="button"
            onClick={carregando === 'estados' || estados.length === 0 ? carregarEstados : () => selecionarUf(uf)}
            className="font-semibold underline"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
```

Cada select **desabilitado até o anterior estar escolhido** (`disabled={!uf || ...}`) é o que
impede a pessoa de tentar escolher um município antes de um estado — sem isso, dava pra abrir o
select de município vazio e ficar sem entender por quê. E trocar de estado **limpa** o município
e a comunidade escolhidos (mesmo princípio defensivo do filtro de município na tela de
Relatórios): sem isso, uma comunidade de Pernambuco continuaria marcada depois de trocar para a
Bahia.

---

## Capítulo 9 — Seção Responsável e contato

```tsx
// src/componentes/familias/SecaoResponsavel.tsx
import type { NovaFamilia } from '@/tipos/dominio';
import Campo, { ENTRADA } from '@/componentes/ui/Campo';

type Props = { estado: NovaFamilia; onCampo: (campo: keyof NovaFamilia, valor: any) => void };

export default function SecaoResponsavel({ estado, onCampo }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Campo label="Nome do responsável">
        <input className={ENTRADA} value={estado.responsavelNome} onChange={(e) => onCampo('responsavelNome', e.target.value)} />
      </Campo>
      <Campo label="CPF" dica="opcional — nem toda família tem documento à mão">
        <input className={ENTRADA} value={estado.responsavelCpf} onChange={(e) => onCampo('responsavelCpf', e.target.value)} />
      </Campo>
      <Campo label="Telefone">
        <input className={ENTRADA} value={estado.telefone} onChange={(e) => onCampo('telefone', e.target.value)} />
      </Campo>
      <Campo label="Ponto de referência" className="sm:col-span-2" dica="útil quando a casa não tem endereço formal">
        <input className={ENTRADA} value={estado.pontoReferencia} onChange={(e) => onCampo('pontoReferencia', e.target.value)} />
      </Campo>
    </div>
  );
}
```

O `responsavelCpf` chega vazio (`""`) no exemplo do próprio endpoint, não como campo ausente —
por isso o tipo é `string`, nunca `string | null`, e o campo é opcional na validação (Capítulo
14). É proposital: exigir CPF bloquearia o cadastro de famílias sem documentação, que é
exatamente parte do público que este sistema atende.

Note que este componente **não tem `<input>` para o nome da pessoa de índice 0** — o nome do
responsável entra só aqui, e o reducer (Capítulo 7) já espelha esse valor dentro de
`pessoas[0].nome` sozinho. Evita a pessoa digitar o mesmo nome duas vezes em duas seções
diferentes da tela.

---

## Capítulo 10 — Seção Moradia e saneamento

```tsx
// src/componentes/familias/SecaoMoradia.tsx
import type { NovaFamilia, AbastecimentoAgua } from '@/tipos/dominio';
import Campo, { ENTRADA } from '@/componentes/ui/Campo';
import Chip from '@/componentes/ui/Chip';
import Switch from '@/componentes/ui/Switch';

type Props = {
  estado: NovaFamilia;
  onCampo: (campo: keyof NovaFamilia, valor: any) => void;
  onToggleAbastecimento: (v: AbastecimentoAgua) => void;
};

const OPCOES_ABASTECIMENTO: { valor: AbastecimentoAgua; rotulo: string }[] = [
  { valor: 'REDE_PUBLICA', rotulo: 'Rede pública' },
  { valor: 'POCO_OU_NASCENTE', rotulo: 'Poço ou nascente' },
  { valor: 'CISTERNA', rotulo: 'Cisterna' },
  { valor: 'CARRO_PIPA', rotulo: 'Carro-pipa' },
  { valor: 'RIO_ACUDE_OU_LAGO', rotulo: 'Rio, açude ou lago' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

export default function SecaoMoradia({ estado, onCampo, onToggleAbastecimento }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Switch rotulo="Tem banheiro" ligado={estado.temBanheiro} onToggle={() => onCampo('temBanheiro', !estado.temBanheiro)} />

      <Campo label="Escoamento sanitário">
        <select className={ENTRADA} value={estado.escoamentoSanitario} onChange={(e) => onCampo('escoamentoSanitario', e.target.value)}>
          <option value="REDE_GERAL">Rede geral de esgoto</option>
          <option value="FOSSA_SEPTICA">Fossa séptica</option>
          <option value="FOSSA_RUDIMENTAR">Fossa rudimentar</option>
          <option value="VALA">Vala</option>
          <option value="RIO_OU_MAR">Rio ou mar</option>
          <option value="NAO_TEM">Não tem</option>
          <option value="OUTRO">Outro</option>
        </select>
      </Campo>

      <Campo label="Tratamento da água consumida">
        <select className={ENTRADA} value={estado.tratamentoAgua} onChange={(e) => onCampo('tratamentoAgua', e.target.value)}>
          <option value="FERVURA">Fervura</option>
          <option value="FILTRACAO">Filtração</option>
          <option value="CLORACAO">Cloração</option>
          <option value="SEM_TRATAMENTO">Sem tratamento</option>
          <option value="OUTRO">Outro</option>
        </select>
      </Campo>

      <Campo label="Abastecimento de água" dica="marque todas as que se aplicam">
        <div className="flex flex-wrap gap-2">
          {OPCOES_ABASTECIMENTO.map((op) => (
            <Chip
              key={op.valor}
              rotulo={op.rotulo}
              marcado={estado.abastecimentoAgua.includes(op.valor)}
              onToggle={() => onToggleAbastecimento(op.valor)}
            />
          ))}
        </div>
      </Campo>
    </div>
  );
}
```

`abastecimentoAgua` é o único campo desta tela que é **array por natureza** (uma casa pode ter
cisterna **e** carro-pipa ao mesmo tempo) — por isso é o único que usa `Chip` em vez de `select`
ou `RadioOpt`.

---

## Capítulo 11 — Seção Membros da família (`pessoas[]`)

A parte mais longa da tela, porque cada pessoa tem três decisões condicionais: data de nascimento
**ou** idade estimada (nunca as duas), série só aparece se estuda, gestante só aparece se o sexo
for feminino.

```tsx
// src/componentes/familias/SecaoMembros.tsx
'use client';

import type { Pessoa } from '@/tipos/dominio';
import Campo, { ENTRADA } from '@/componentes/ui/Campo';
import RadioOpt from '@/componentes/ui/RadioOpt';
import Switch from '@/componentes/ui/Switch';

type Props = {
  pessoas: Pessoa[];
  onCampo: (indice: number, campo: keyof Pessoa, valor: any) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
};

export default function SecaoMembros({ pessoas, onCampo, onAdicionar, onRemover }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {pessoas.map((pessoa, indice) => (
        <div key={indice} className="rounded-md bg-ink-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-900">
              {indice === 0 ? 'Responsável' : `Pessoa ${indice + 1}`}
            </span>
            {indice > 0 && (
              <button type="button" onClick={() => onRemover(indice)} className="text-xs font-semibold text-danger-700 hover:underline">
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome" className="mb-0">
              <input className={ENTRADA} value={pessoa.nome} onChange={(e) => onCampo(indice, 'nome', e.target.value)} />
            </Campo>

            <Campo label="Parentesco" className="mb-0">
              <select
                className={ENTRADA}
                value={pessoa.parentesco}
                disabled={indice === 0}
                onChange={(e) => onCampo(indice, 'parentesco', e.target.value)}
              >
                <option value="RESPONSAVEL">Responsável</option>
                <option value="CONJUGE">Cônjuge</option>
                <option value="FILHO">Filho</option>
                <option value="FILHA">Filha</option>
                <option value="ENTEADO">Enteado</option>
                <option value="ENTEADA">Enteada</option>
                <option value="NETO">Neto</option>
                <option value="NETA">Neta</option>
                <option value="IRMAO">Irmão</option>
                <option value="IRMA">Irmã</option>
                <option value="PAI">Pai</option>
                <option value="MAE">Mãe</option>
                <option value="OUTRO_PARENTE">Outro parente</option>
                <option value="AGREGADO">Agregado</option>
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Sexo" className="mb-0">
              <div className="flex gap-2">
                <RadioOpt rotulo="Feminino" selecionado={pessoa.sexo === 'FEMININO'} onSelecionar={() => onCampo(indice, 'sexo', 'FEMININO')} />
                <RadioOpt rotulo="Masculino" selecionado={pessoa.sexo === 'MASCULINO'} onSelecionar={() => onCampo(indice, 'sexo', 'MASCULINO')} />
              </div>
            </Campo>

            <SeletorIdade pessoa={pessoa} indice={indice} onCampo={onCampo} />
          </div>

          <div className="mt-1 flex flex-wrap gap-6">
            <Switch rotulo="Estuda" ligado={pessoa.estuda} onToggle={() => onCampo(indice, 'estuda', !pessoa.estuda)} />
            {pessoa.sexo === 'FEMININO' && (
              <Switch rotulo="Gestante" ligado={pessoa.gestante} onToggle={() => onCampo(indice, 'gestante', !pessoa.gestante)} />
            )}
          </div>

          {pessoa.estuda && (
            <Campo label="Série" className="mt-3 max-w-xs">
              <select className={ENTRADA} value={pessoa.serie ?? ''} onChange={(e) => onCampo(indice, 'serie', e.target.value)}>
                <option value="">Selecione</option>
                <option value="CRECHE">Creche</option>
                <option value="PRE">Pré-escola</option>
                <option value="FUNDAMENTAL_1">Fundamental I</option>
                <option value="FUNDAMENTAL_2">Fundamental II</option>
                <option value="MEDIO">Ensino médio</option>
                <option value="EJA">EJA</option>
                <option value="SUPERIOR">Superior</option>
              </select>
            </Campo>
          )}

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Tamanho de roupa" className="mb-0">
              <select className={ENTRADA} value={pessoa.tamanhoRoupa ?? ''} onChange={(e) => onCampo(indice, 'tamanhoRoupa', e.target.value)}>
                <option value="">Selecione</option>
                <option value="RN">Recém-nascido</option>
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
              </select>
            </Campo>
            <Campo label="Número do calçado" className="mb-0">
              <input className={ENTRADA} value={pessoa.numeroCalcado} onChange={(e) => onCampo(indice, 'numeroCalcado', e.target.value)} />
            </Campo>
          </div>

          {pessoa.cadastroIncompleto && (
            <p className="mt-3 text-xs font-medium text-amber-800">
              Sem nome ainda — o cadastro salva mesmo assim, marcado como incompleto.
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={onAdicionar}
        className="self-start rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-ink-100"
      >
        + Adicionar pessoa
      </button>
    </div>
  );
}

function SeletorIdade({ pessoa, indice, onCampo }: { pessoa: Pessoa; indice: number; onCampo: Props['onCampo'] }) {
  const sabeData = pessoa.dataNascimento != null;

  function alternar() {
    if (sabeData) {
      onCampo(indice, 'dataNascimento', null);
      onCampo(indice, 'idadeEstimadaEm', new Date().toISOString().slice(0, 10));
    } else {
      onCampo(indice, 'idadeEstimada', null);
      onCampo(indice, 'idadeEstimadaEm', null);
      onCampo(indice, 'dataNascimento', '');
    }
  }

  return (
    <Campo
      label={sabeData ? 'Data de nascimento' : 'Idade estimada'}
      className="mb-0"
      dica={undefined}
    >
      <div className="mb-1.5 flex justify-end">
        <button type="button" onClick={alternar} className="text-xs font-medium text-primary-700 hover:underline">
          {sabeData ? 'não sei a data exata' : 'informar data exata'}
        </button>
      </div>
      {sabeData ? (
        <input type="date" className={ENTRADA} value={pessoa.dataNascimento ?? ''} onChange={(e) => onCampo(indice, 'dataNascimento', e.target.value)} />
      ) : (
        <input
          type="number"
          min={0}
          className={ENTRADA}
          placeholder="idade em anos"
          value={pessoa.idadeEstimada ?? ''}
          onChange={(e) => onCampo(indice, 'idadeEstimada', Number(e.target.value))}
        />
      )}
    </Campo>
  );
}
```

Por que a pessoa de índice 0 não tem botão de remover, e o `select` de parentesco dela vem
travado em "Responsável": ela **é** o responsável cadastrado no topo do formulário (Capítulo 9) —
removê-la ou trocar o parentesco dela deixaria o formulário num estado sem responsável nenhum, o
que o próprio endpoint não tem como representar (`responsavelNome` é um campo obrigatório à
parte). Trava na interface é mais barato que validação depois.

---

## Capítulo 12 — Seção Fontes de renda (`fontesRenda[]`)

```tsx
// src/componentes/familias/SecaoFontesRenda.tsx
import type { FonteRenda, Pessoa } from '@/tipos/dominio';
import Campo, { ENTRADA } from '@/componentes/ui/Campo';

type Props = {
  fontesRenda: FonteRenda[];
  pessoas: Pessoa[];
  onCampo: (indice: number, campo: keyof FonteRenda, valor: any) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
};

export default function SecaoFontesRenda({ fontesRenda, pessoas, onCampo, onAdicionar, onRemover }: Props) {
  if (fontesRenda.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
        Nenhuma fonte de renda cadastrada.{' '}
        <button type="button" onClick={onAdicionar} className="font-semibold text-primary-700 hover:underline">
          Adicionar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fontesRenda.map((fonte, indice) => (
        <div key={indice} className="grid grid-cols-1 items-end gap-3 rounded-md bg-ink-100 p-4 sm:grid-cols-[1.3fr_1.3fr_1.1fr_auto]">
          <Campo label="Tipo" className="mb-0">
            <select className={ENTRADA} value={fonte.tipo} onChange={(e) => onCampo(indice, 'tipo', e.target.value)}>
              <option value="BOLSA_FAMILIA">Bolsa Família</option>
              <option value="BPC">BPC</option>
              <option value="APOSENTADORIA">Aposentadoria</option>
              <option value="PENSAO">Pensão</option>
              <option value="TRABALHO_FORMAL">Trabalho formal</option>
              <option value="TRABALHO_INFORMAL">Trabalho informal</option>
              <option value="OUTRO">Outro</option>
            </select>
          </Campo>

          <Campo label="Quem recebe" className="mb-0">
            <select className={ENTRADA} value={fonte.pessoaIndice} onChange={(e) => onCampo(indice, 'pessoaIndice', Number(e.target.value))}>
              {pessoas.map((p, i) => (
                <option key={i} value={i}>{p.nome.trim() || `Pessoa ${i + 1}`}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Faixa" className="mb-0">
            <select className={ENTRADA} value={fonte.faixa} onChange={(e) => onCampo(indice, 'faixa', e.target.value)}>
              <option value="SEM_RENDA_FIXA">Sem renda fixa</option>
              <option value="ATE_MEIO_SALARIO">Até meio salário mínimo</option>
              <option value="MEIO_A_UM_SALARIO">De meio a um salário mínimo</option>
              <option value="UM_A_DOIS_SALARIOS">De um a dois salários mínimos</option>
              <option value="ACIMA_DE_DOIS_SALARIOS">Acima de dois salários mínimos</option>
            </select>
          </Campo>

          <button type="button" onClick={() => onRemover(indice)} className="pb-2.5 text-xs font-semibold text-danger-700 hover:underline">
            Remover
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdicionar}
        className="self-start rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-ink-100"
      >
        + Adicionar fonte de renda
      </button>
    </div>
  );
}
```

O select "Quem recebe" mostra `Pessoa ${i + 1}` quando o nome ainda está vazio — a mesma
tolerância a cadastro incompleto do Capítulo 11, aplicada aqui também: não dá pra travar a tela
de fontes de renda esperando que toda pessoa já tenha nome preenchido.

---

## Capítulo 13 — `cadastroIncompleto` é derivado, nunca digitado

O design system de vocês já tem o tom de voz certo pra essa situação — um dos alertas de exemplo
do próprio catálogo é **"3 membros sem nome — Cadastro salvo mesmo assim, volte para completar
quando souber os nomes."** Isso é a confirmação de que o produto já foi pensado para aceitar
cadastro parcial: a pessoa que faz o levantamento em campo pode saber que uma família tem cinco
moradores sem saber o nome de todos na hora.

Por isso `cadastroIncompleto` não é uma pergunta feita à usuária — é calculado sozinho, toda vez
que o nome de uma pessoa muda (linha `atualizada.cadastroIncompleto = !atualizada.nome.trim();`
no reducer, Capítulo 7). Nenhum componente de tela precisa se preocupar em marcá-lo.

---

## Capítulo 14 — Validação antes de enviar

Poucas travas, e só nas que realmente impedem o backend de aceitar o registro — o resto (CPF,
telefone, data de nascimento) fica como recomendado, não obrigatório, pela mesma razão do
Capítulo 9: exigir demais no formulário é o jeito mais rápido de a família não ser cadastrada de
jeito nenhum.

```ts
export function validar(estado: NovaFamilia): string | null {
  if (!estado.comunidadeId) return 'Selecione a comunidade antes de salvar.';
  if (!estado.responsavelNome.trim()) return 'Informe o nome do responsável.';
  return null;
}
```

**Proposta a confirmar com o time**: se telefone, CPF ou data de nascimento devem entrar nessa
validação como obrigatórios em algum cenário (por exemplo, famílias que já recebem benefício e
por isso precisam de CPF). Comecei do lado mais permissivo porque é mais fácil apertar depois do
que descobrir, com uma família real na porta, que o formulário não deixa salvar sem um dado que
ela não tem.

---

## Capítulo 15 — Envio: `POST`, sucesso e erro

```tsx
// dentro de FormularioFamilia.tsx — ver o componente inteiro no Capítulo 16
async function enviar(e: React.FormEvent) {
  e.preventDefault();

  const mensagem = validar(estado);
  if (mensagem) {
    setErro(mensagem);
    return;
  }

  setEnviando(true);
  setErro(null);
  try {
    await criarFamilia(estado);
    router.push('/familias');
  } catch {
    setErro('Não foi possível salvar. Verifique sua conexão e tente novamente.');
  } finally {
    setEnviando(false);
  }
}
```

Sem tela de sucesso separada — redirecionar para `/familias` depois do `POST` já comunica que
funcionou (a família nova aparece na lista). Se o time preferir um retorno mais explícito (um
`alert-success` antes de sair da tela, como o catálogo já define), é trocar o `router.push` por
um estado de "salvo" que mostra o alerta e só then navega.

---

## Capítulo 16 — Juntando tudo: `FormularioFamilia.tsx`

```tsx
// src/componentes/familias/FormularioFamilia.tsx
'use client';

import { useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reducer, estadoInicial, validar } from './formularioReducer';
import { criarFamilia } from '@/lib/familias';
import Cartao from '@/componentes/ui/Cartao';
import { ENTRADA } from '@/componentes/ui/Campo';
import SelecaoLocalizacao from './SelecaoLocalizacao';
import SecaoResponsavel from './SecaoResponsavel';
import SecaoMoradia from './SecaoMoradia';
import SecaoMembros from './SecaoMembros';
import SecaoFontesRenda from './SecaoFontesRenda';

export default function FormularioFamilia() {
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const semNome = estado.pessoas.filter((p) => p.cadastroIncompleto).length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const mensagem = validar(estado);
    if (mensagem) { setErro(mensagem); return; }

    setEnviando(true);
    setErro(null);
    try {
      await criarFamilia(estado);
      router.push('/familias');
    } catch {
      setErro('Não foi possível salvar. Verifique sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Localização</h2>
        <SelecaoLocalizacao
          comunidadeId={estado.comunidadeId}
          onComunidadeChange={(id) => dispatch({ type: 'CAMPO', campo: 'comunidadeId', valor: id })}
        />
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Responsável e contato</h2>
        <SecaoResponsavel estado={estado} onCampo={(campo, valor) => dispatch({ type: 'CAMPO', campo, valor })} />
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Moradia e saneamento</h2>
        <SecaoMoradia
          estado={estado}
          onCampo={(campo, valor) => dispatch({ type: 'CAMPO', campo, valor })}
          onToggleAbastecimento={(v) => dispatch({ type: 'ABASTECIMENTO_TOGGLE', valor: v })}
        />
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Membros da família</h2>
        <SecaoMembros
          pessoas={estado.pessoas}
          onCampo={(indice, campo, valor) => dispatch({ type: 'PESSOA_CAMPO', indice, campo, valor })}
          onAdicionar={() => dispatch({ type: 'PESSOA_ADICIONAR' })}
          onRemover={(indice) => dispatch({ type: 'PESSOA_REMOVER', indice })}
        />
        {semNome > 0 && (
          <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            {semNome} {semNome === 1 ? 'pessoa está' : 'pessoas estão'} sem nome — o cadastro salva
            mesmo assim, marcado como incompleto.
          </div>
        )}
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Fontes de renda</h2>
        <SecaoFontesRenda
          fontesRenda={estado.fontesRenda}
          pessoas={estado.pessoas}
          onCampo={(indice, campo, valor) => dispatch({ type: 'FONTE_RENDA_CAMPO', indice, campo, valor })}
          onAdicionar={() => dispatch({ type: 'FONTE_RENDA_ADICIONAR' })}
          onRemover={(indice) => dispatch({ type: 'FONTE_RENDA_REMOVER', indice })}
        />
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-display text-lg text-ink-900">Observações gerais</h2>
        <textarea
          className={`${ENTRADA} min-h-[100px]`}
          value={estado.observacoes}
          onChange={(e) => dispatch({ type: 'CAMPO', campo: 'observacoes', valor: e.target.value })}
        />
      </Cartao>

      {erro && <div className="rounded-md bg-danger-50 p-4 text-sm text-danger-800">{erro}</div>}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
      >
        {enviando ? 'Salvando…' : 'Salvar cadastro'}
      </button>
    </form>
  );
}
```

```tsx
// src/app/(app)/familias/novo/page.tsx
import FormularioFamilia from '@/componentes/familias/FormularioFamilia';

export default function NovaFamiliaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl text-ink-900">Nova família</h1>
      <FormularioFamilia />
    </div>
  );
}
```

Cada seção é o seu próprio `<Cartao>`, no mesmo espírito de "nenhum cartão dentro de cartão" da
Tela de Relatórios — e por isso cada pessoa e cada fonte de renda, dentro das suas seções, usa um
painel preenchido (`bg-ink-100`, sem borda nem sombra própria) em vez de mais um `<Cartao>`
aninhado.

---

## Capítulo 17 — Ordem recomendada de implementação

1. Confirmar com o backend a lista completa de valores de cada enum (Capítulo 1).
2. Confirmar o formato de `GET /comunidades?codigoIbge=`.
3. Acrescentar os tipos do Capítulo 2 a `src/tipos/dominio.ts`.
4. Acrescentar `buscarEstados`/`buscarMunicipiosPorEstado` a `src/lib/ibge.ts` e testar os dois
   isoladamente (Pernambuco, `PE`, é um bom teste rápido).
5. Criar `src/lib/familias.ts`.
6. Criar os componentes de campo do Capítulo 5 (`Campo`, `Chip`, `RadioOpt`, `Switch`).
7. Criar `formularioReducer.ts` e testar as ações isoladamente (sem interface) — principalmente
   `PESSOA_REMOVER`, pela armadilha do `pessoaIndice`.
8. Criar `SelecaoLocalizacao.tsx` e testar a cascata sozinha, antes de plugar no formulário.
9. Criar as seções restantes, uma de cada vez: Responsável, Moradia, Membros, Fontes de renda.
10. Montar `FormularioFamilia.tsx` juntando tudo.
11. Criar `page.tsx`.
12. Testar o fluxo inteiro com uma família de 1 pessoa, depois com uma de 4+ pessoas e 2 fontes
    de renda, removendo pessoas do meio da lista para validar o ajuste de índice.
13. Rodar `typecheck`, `lint` e `build`.

---

## Capítulo 18 — Checklist de aceite

- [ ] A página abre em `/familias/novo`
- [ ] O código do estado/município nunca é digitado — só selecionado
- [ ] Município e Comunidade ficam desabilitados até o campo anterior da cascata ser escolhido
- [ ] Trocar de estado limpa o município e a comunidade selecionados
- [ ] Trocar de município limpa a comunidade selecionada
- [ ] IBGE fora do ar mostra aviso com botão de tentar de novo, não tela em branco
- [ ] O nome do responsável e o nome da pessoa de índice 0 são sempre o mesmo valor
- [ ] A pessoa de índice 0 não pode ser removida, nem ter o parentesco trocado
- [ ] "Série" só aparece quando "Estuda" está ligado
- [ ] "Gestante" só aparece quando o sexo é feminino, e se desliga sozinho ao trocar para masculino
- [ ] Cada pessoa tem data de nascimento **ou** idade estimada, nunca os dois ao mesmo tempo
- [ ] `cadastroIncompleto` é calculado a partir do nome, nunca digitado pela usuária
- [ ] Remover uma pessoa do meio da lista ajusta o `pessoaIndice` de toda fonte de renda depois dela
- [ ] Remover uma pessoa que era a única fonte de uma renda remove essa fonte de renda também
- [ ] O select "Quem recebe" mostra "Pessoa N" para quem ainda não tem nome preenchido
- [ ] CPF, telefone e ponto de referência podem ficar em branco sem impedir o envio
- [ ] Não é possível enviar sem selecionar uma comunidade
- [ ] Não é possível enviar sem o nome do responsável
- [ ] Erro de rede no envio mostra mensagem clara, sem perder o que já foi preenchido

---

## Capítulo 19 — Roteiro de teste manual

1. Abrir `/familias/novo` e confirmar que "Estado" já vem carregado, sem precisar de ação.
2. Escolher Pernambuco, depois Petrolândia, depois qualquer comunidade — confirmar que a lista
   de comunidades muda para as de Petrolândia.
3. Trocar o estado para outro qualquer e confirmar que Município e Comunidade voltam a "Selecione".
4. Preencher o responsável, adicionar 3 pessoas, marcar uma delas como "Estuda" e conferir que
   "Série" aparece só nela.
5. Marcar uma pessoa como feminino e "Gestante"; trocar o sexo dela para masculino e confirmar
   que "Gestante" desliga e some da tela sozinho.
6. Adicionar 2 fontes de renda apontando para pessoas diferentes; remover a pessoa do meio da
   lista (não a primeira, não a última) e confirmar que as fontes de renda continuam apontando
   para as pessoas certas.
7. Deixar uma pessoa sem nome e confirmar o aviso de cadastro incompleto, e que o envio funciona
   mesmo assim.
8. Tentar enviar sem selecionar comunidade — confirmar que a mensagem de erro aparece e nada é
   enviado.
9. Desligar a rede e tentar enviar um cadastro válido — confirmar a mensagem de erro de conexão,
   e que os dados preenchidos continuam na tela depois do erro.

---

## Capítulo 20 — Perguntas para alinhar com o time

1. **A lista completa de valores de cada enum** (Capítulo 1) — presumida a partir do vocabulário
   comum de cadastro social; precisa da confirmação do backend antes de fechar os `<select>`.
2. **O formato de `GET /comunidades?codigoIbge=`** — proposta deste guia, não confirmada.
3. **Quais campos devem ser obrigatórios de verdade** além de comunidade e nome do responsável —
   este guia começou do lado permissivo (Capítulo 14) de propósito.
4. **O que acontece depois do envio** — este guia assume um redirecionamento simples para
   `/familias`; se o time quiser uma confirmação explícita na tela antes de sair, é uma mudança
   pequena (Capítulo 15).
5. **Layout definitivo** — como não veio Figma desta tela (Capítulo 0), a ordem e o agrupamento
   das seções aqui é uma proposta organizada a partir do JSON; comparem com o design assim que
   ele existir.

---

## Capítulo 21 — Glossário rápido

| Termo | O que é |
|---|---|
| **Cascata** | Uma seleção que depende da anterior — aqui, Estado → Município → Comunidade, onde cada select só habilita depois que o de cima foi escolhido |
| **`pessoaIndice`** | Campo de `FonteRenda` que aponta para a posição de uma pessoa dentro do array `pessoas` — não é um id, é uma posição, por isso desloca quando alguém é removido do meio da lista |
| **`useReducer`** | Hook do React para estado que muda por ações nomeadas em vez de vários `setState` soltos — ajuda quando uma mudança precisa afetar mais de um pedaço do estado ao mesmo tempo |
| **Campo derivado** | Um valor calculado a partir de outros campos do formulário, nunca preenchido diretamente pela usuária — aqui, `cadastroIncompleto` |
| **Cadastro incompleto** | Registro salvo mesmo com informação faltando (como o nome de uma pessoa), para não travar o levantamento em campo por causa de um dado que ainda não se sabe |
