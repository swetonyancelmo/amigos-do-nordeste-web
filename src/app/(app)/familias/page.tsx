'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Carregando, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { Paginacao } from '@/componentes/ui/paginacao';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { FalhaAoCarregar } from '@/componentes/ui/falha-ao-carregar';
import { BarraFiltros, FiltroAlternar, FiltroBusca, FiltroRemovivel, FiltroSelecao } from '@/componentes/ui/filtro';
import { SeloEstrato } from '@/componentes/ui/selo-estrato';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { tabelaCartoes as tc } from '@/componentes/ui/tabela-cartoes';
import { api } from '@/lib/api';
import { pegarRecado } from '@/lib/recado';
import { useMetadados } from '@/lib/metadados';
import { cn } from '@/lib/utils';
import type { Comunidade, FamiliaResumo, OrdenacaoFamilia, Pagina } from '@/tipos/dominio';
import { DetalhesFamilia } from './DetalhesFamilia';

// Fora do componente: JSX estável, o cabeçalho não re-renderiza à toa.
const ACOES = (
  <Link href="/familias/nova" className="botao botao--primario">
    Nova família
  </Link>
);

const formatarNumero = (n: number) => n.toLocaleString('pt-BR');

/* ----------------------------------------------------------------- página */

/**
 * Lista de famílias (tela 02 do Figma).
 *  - a busca é pelo nome da responsável (a API ignora acento);
 *  - os totais de cada linha vêm calculados da API;
 *  - paginação simples, sem scroll infinito;
 *  - estrato, ordenação, comunidade e município moram na URL: a tela
 *    sobrevive ao recarregar e o Início linka direto para "cadastros a
 *    completar". Filtro e ordem por estrato são da API (o estrato é
 *    calculado lá); reordenar a página aqui faria a paginação mentir.
 */
export default function Familias() {
  return (
    <Suspense fallback={<Carregando mensagem="Carregando famílias" linhas={6} />}>
      <ConteudoFamilias />
    </Suspense>
  );
}

function ConteudoFamilias() {
  useCabecalho('Famílias', ACOES);
  const router = useRouter();
  const pathname = usePathname();
  const parametrosUrl = useSearchParams();
  const comunidadeId = parametrosUrl.get('comunidadeId') ?? '';
  const municipioId = parametrosUrl.get('municipioId') ?? '';
  const estrato = parametrosUrl.get('estrato') ?? '';
  const ordenacao: OrdenacaoFamilia = parametrosUrl.get('ordenacao') === 'PRIORIDADE' ? 'PRIORIDADE' : 'NOME';
  const { metadados } = useMetadados();

  const [digitado, setDigitado] = useState('');
  const [busca, setBusca] = useState('');
  const [semBanheiro, setSemBanheiro] = useState(false);
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(20);

  const [resposta, setResposta] = useState<Pagina<FamiliaResumo> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [selecionada, setSelecionada] = useState<FamiliaResumo | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  // sobe quando a lista precisa vir de novo sem mudar filtro (ex.: inativou)
  const [recarga, setRecarga] = useState(0);
  const ultimaRequisicao = useRef(0);
  // Nome da família que abriu a ficha: o foco volta para ele ao fechar. O
  // Dialog é controlado (não há DialogTrigger), então o Radix não sabe quem
  // abriu; e no toque do iPhone o botão nem chega a ganhar foco.
  const origemDaFicha = useRef<HTMLElement | null>(null);

  // Recado de quem mandou para cá (ex.: "Família atualizada"). Lido depois de
  // montar, para a região role="status" já existir e o leitor de tela anunciar.
  useEffect(() => {
    const texto = pegarRecado();
    if (texto) setRecado(texto);
  }, []);

  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const espera = setTimeout(() => {
      setBusca(digitado.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(espera);
  }, [digitado]);

  // Comunidades para o filtro
  useEffect(() => {
    api.get<Comunidade[]>('/comunidades').then(setComunidades).catch(() => setComunidades([]));
  }, []);

  // Lista de famílias
  useEffect(() => {
    const requisicao = ++ultimaRequisicao.current;
    const atual = () => requisicao === ultimaRequisicao.current; // ignora resposta atrasada

    const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
    if (busca) params.set('busca', busca);
    if (comunidadeId) params.set('comunidadeId', comunidadeId);
    if (municipioId) params.set('municipioId', municipioId);
    if (semBanheiro) params.set('semBanheiro', 'true');
    if (incluirInativas) params.set('incluirInativas', 'true');
    if (estrato) params.set('estrato', estrato);
    if (ordenacao === 'PRIORIDADE') params.set('ordenacao', 'PRIORIDADE');

    setCarregando(true);
    setErro('');
    api
      .get<Pagina<FamiliaResumo>>(`/familias?${params}`)
      .then((dado) => atual() && setResposta(dado))
      .catch((e) => atual() && setErro(mensagemDeFalha(e, 'Não foi possível carregar as famílias. Tente de novo.')))
      .finally(() => atual() && setCarregando(false));
  }, [busca, comunidadeId, municipioId, estrato, ordenacao, semBanheiro, incluirInativas, pagina, porPagina, recarga]);

  /** Troca um filtro que mora na URL e volta para a primeira página. */
  function trocarNaUrl(nome: string, valor: string) {
    const novos = new URLSearchParams(parametrosUrl.toString());
    if (valor) novos.set(nome, valor);
    else novos.delete(nome);
    const consulta = novos.toString();
    router.replace(`${pathname}${consulta ? `?${consulta}` : ''}`, { scroll: false });
    setPagina(0);
  }

  const fecharModal = useCallback(() => setSelecionada(null), []);
  const abrirFicha = (familia: FamiliaResumo, nome: HTMLElement | null) => {
    origemDaFicha.current = nome;
    setSelecionada(familia);
  };
  const aoMudarSituacao = useCallback((texto: string) => {
    setSelecionada(null);
    setRecado(texto);
    setRecarga((n) => n + 1);
  }, []);

  const escolherComunidade = (id: string) => trocarNaUrl('comunidadeId', id);
  // o filtro de município só chega pela URL (link do Início); aqui ele só se desfaz
  const nomeMunicipioFiltrado = comunidades.find((c) => c.municipioId === municipioId)?.municipioNome;
  const alternarSemBanheiro = () => {
    setSemBanheiro((v) => !v);
    setPagina(0);
  };
  const alternarInativas = () => {
    setIncluirInativas((v) => !v);
    setPagina(0);
  };

  const itens = resposta?.itens ?? [];
  const total = resposta?.total ?? 0;

  return (
    // data-preflight: o reset do Tailwind vale nesta tela (sem ele os
    // primitivos saem sutilmente errados). Ver tailwind.css. `pagina-pessoas`
    // é o gancho do casco antigo (componentes.css) para a altura no celular.
    <div data-preflight className="pagina-pessoas w-full max-w-full min-w-0 overflow-x-clip">
      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <div role="status">{recado && <Aviso>{recado}</Aviso>}</div>

        <p className="text-sm text-muted-foreground">
          {resposta ? `${formatarNumero(total)} ${total === 1 ? 'família' : 'famílias'}` : 'Carregando famílias…'}
        </p>

        <FiltroBusca
          rotulo="Buscar pelo nome da responsável"
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          placeholder="Buscar pelo nome da responsável…"
        />

        <BarraFiltros>
          <FiltroSelecao
            rotulo="Comunidade"
            className="w-72"
            valor={comunidadeId}
            onValor={escolherComunidade}
            opcaoVazia="Todas as comunidades"
            opcoes={comunidades.map((c) => ({ valor: c.id, rotulo: `${c.nome} · ${c.municipioNome}` }))}
          />
          {/* Rótulos dos estratos vêm da API (configuráveis), nunca daqui. */}
          <FiltroSelecao
            rotulo="Prioridade sugerida"
            className="w-60"
            valor={estrato}
            onValor={(v) => trocarNaUrl('estrato', v)}
            opcaoVazia="Toda prioridade sugerida"
            opcoes={metadados?.estratoVulnerabilidade ?? []}
          />
          <FiltroSelecao
            rotulo="Ordenar"
            className="w-72"
            valor={ordenacao}
            onValor={(v) => trocarNaUrl('ordenacao', v === 'PRIORIDADE' ? 'PRIORIDADE' : '')}
            ativo={ordenacao === 'PRIORIDADE'}
            opcoes={[
              { valor: 'NOME', rotulo: 'Ordem: nome da responsável' },
              { valor: 'PRIORIDADE', rotulo: 'Ordem: prioridade sugerida' },
            ]}
          />
          {municipioId && (
            <FiltroRemovivel
              rotuloRemover={`Tirar o filtro de município${nomeMunicipioFiltrado ? ` ${nomeMunicipioFiltrado}` : ''}`}
              onRemover={() => trocarNaUrl('municipioId', '')}
            >
              Município: {nomeMunicipioFiltrado ?? 'filtrado'}
            </FiltroRemovivel>
          )}
          <FiltroAlternar ativo={semBanheiro} onAlternar={alternarSemBanheiro}>
            Sem banheiro
          </FiltroAlternar>
          <FiltroAlternar ativo={incluirInativas} onAlternar={alternarInativas}>
            Incluir inativas
          </FiltroAlternar>
        </BarraFiltros>

        {erro && <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setRecarga((n) => n + 1)} />}

        {!resposta && carregando && <Carregando mensagem="Carregando famílias" linhas={6} />}

        {resposta && (
          <div className={tc.moldura}>
            <div
              className={cn('transition-opacity', carregando && 'opacity-55')}
              aria-busy={carregando}
            >
              <Table className={tc.tabela}>
                <TableCaption className="sr-only">
                  Famílias cadastradas. Ative o nome da responsável para abrir a ficha.
                </TableCaption>
                <TableHeader className={tc.cabecalho}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tc.cabeca}>Responsável</TableHead>
                    <TableHead className={tc.cabeca}>Prioridade sugerida</TableHead>
                    <TableHead className={tc.cabeca}>Comunidade</TableHead>
                    <TableHead className={tc.cabeca}>Município</TableHead>
                    <TableHead className={cn(tc.cabeca, tc.numero)}>Pessoas</TableHead>
                    <TableHead className={cn(tc.cabeca, tc.numero)}>Até 12</TableHead>
                    <TableHead className={cn(tc.cabeca, tc.numero)}>13 a 59</TableHead>
                    <TableHead className={cn(tc.cabeca, tc.numero)}>60+</TableHead>
                    <TableHead className={tc.cabeca}>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((familia) => (
                    <TableRow
                      key={familia.id}
                      className={tc.linha}
                      onClick={(e) => abrirFicha(familia, e.currentTarget.querySelector('button'))}
                    >
                      <TableCell className={cn(tc.celula, tc.inteira)}>
                        <Button
                          type="button"
                          variant="link"
                          className="-mx-1 h-auto min-h-[24px] px-1 py-0.5 font-heading text-base font-extrabold text-foreground hover:text-primary celular:min-h-11"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirFicha(familia, e.currentTarget);
                          }}
                        >
                          {familia.responsavelNome}
                        </Button>
                      </TableCell>
                      <TableCell className={cn(tc.celula, tc.inteira, 'min-w-48')} data-rotulo="Prioridade sugerida">
                        {familia.vulnerabilidade
                          ? <SeloEstrato estrato={familia.vulnerabilidade.estrato} rotulo={familia.vulnerabilidade.rotulo} />
                          : '—'}
                      </TableCell>
                      <TableCell className={cn(tc.celula, tc.meia)} data-rotulo="Comunidade">{familia.comunidadeNome}</TableCell>
                      <TableCell className={cn(tc.celula, tc.meia)} data-rotulo="Município">{familia.municipioNome}</TableCell>
                      <TableCell className={cn(tc.celula, tc.numero)} data-rotulo="Pessoas">{familia.totalPessoas}</TableCell>
                      <TableCell className={cn(tc.celula, tc.numero)} data-rotulo="Até 12">{familia.totalAte12Anos}</TableCell>
                      <TableCell className={cn(tc.celula, tc.numero)} data-rotulo="13 a 59">{familia.totalDe13A59Anos}</TableCell>
                      <TableCell className={cn(tc.celula, tc.numero)} data-rotulo="60+">{familia.total60AnosOuMais}</TableCell>
                      <TableCell className={cn(tc.celula, tc.inteira)} data-rotulo="Situação">
                        <div className="flex flex-wrap gap-2">
                          {!familia.ativa && <Badge variant="destructive">Inativa</Badge>}
                          {familia.semBanheiro && <Badge className="bg-accent text-accent-foreground">Sem banheiro</Badge>}
                          {familia.ativa && !familia.semBanheiro && '—'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {itens.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground">Nenhuma família encontrada com esses filtros.</p>
            )}
          </div>
        )}

        {resposta && total > 0 && (
          <Paginacao
            rotulo="famílias"
            pagina={pagina}
            porPagina={porPagina}
            total={total}
            onPagina={setPagina}
            onPorPagina={(n) => { setPorPagina(n); setPagina(0); }}
          />
        )}
      </section>

      <Dialog open={selecionada !== null} onOpenChange={(aberto) => !aberto && fecharModal()}>
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={(e) => {
            if (!origemDaFicha.current?.isConnected) return;
            e.preventDefault();
            origemDaFicha.current.focus();
          }}
          aria-describedby={undefined}
          className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-[760px] celular:p-4"
        >
          <DialogHeader className="flex-row items-center justify-between gap-3">
            <DialogTitle className="text-[1.4rem] leading-tight font-extrabold">
              {selecionada ? `Família de ${selecionada.responsavelNome}` : 'Família'}
            </DialogTitle>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Fechar modal" className="shrink-0">
                <XIcon aria-hidden="true" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {selecionada && (
            <DetalhesFamilia key={selecionada.id} id={selecionada.id} onSituacaoMudou={aoMudarSituacao} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
