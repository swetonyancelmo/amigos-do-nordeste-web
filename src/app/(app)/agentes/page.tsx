'use client';

import { CheckIcon, ClockIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Carregando, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { ResumoErros } from '@/componentes/ResumoErros';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import { Campo } from '@/componentes/ui/campo';
import { Card } from '@/componentes/ui/card';
import { ConfirmarAcao } from '@/componentes/ui/confirmar-acao';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { FalhaAoCarregar } from '@/componentes/ui/falha-ao-carregar';
import { Paginacao, paginarNoCliente } from '@/componentes/ui/paginacao';
import { useErrosDeCampo } from '@/componentes/useErrosDeCampo';
import { api, ErroApi } from '@/lib/api';
import { dataHora } from '@/lib/datas';
import type { Agente } from '@/tipos/dominio';

const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Não foi possível concluir a operação.');

const ID_NOME_AGENTE = 'nome-agente';

const APOIO = 'text-sm text-muted-foreground';

const porNome = (a: Agente, b: Agente) => a.nome.localeCompare(b.nome, 'pt-BR');

/** "472916" → "472 916". O app ignora o espaço ao ativar. */
const agrupado = (codigo: string) => `${codigo.slice(0, 3)} ${codigo.slice(3)}`;

/** `nome` dá contexto ao botão para o leitor de tela: há um "Copiar" por agente (WCAG 2.4.6). */
function Codigo({ codigo, nome }: { codigo: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const espera = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(espera);
  }, [copiado]);

  function copiar() {
    navigator.clipboard?.writeText(codigo).then(() => setCopiado(true), () => {});
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-heading text-[1.375rem] font-extrabold tracking-[0.08em] text-foreground tabular-nums" aria-label={`Código ${codigo.split('').join(' ')}`}>
        {agrupado(codigo)}
      </span>
      <Button
        variant="outline"
        type="button"
        onClick={copiar}
        aria-label={copiado ? `Copiado, código de ${nome}` : `Copiar código de ${nome}`}
      >
        {copiado ? 'Copiado' : 'Copiar'}
      </Button>
      <span className="sr-only" role="status">{copiado ? 'Código copiado' : ''}</span>
    </div>
  );
}

/**
 * Agentes de saúde que usam o app de campo. A agente não tem e-mail nem
 * senha: o celular dela é ativado com um código de seis dígitos, de uso
 * único, que só a API gera. Gerar um código novo desliga o celular atual na
 * hora — é o caminho para aparelho perdido ou trocado.
 */
export default function Agentes() {
  const [agentes, setAgentes] = useState<Agente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(20);

  const [novaAberta, setNovaAberta] = useState(false);
  const [nome, setNome] = useState('');
  const validacao = useErrosDeCampo();
  const { mostrar: mostrarErros } = validacao;
  const [erroNova, setErroNova] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState<Agente | null>(null);

  const [tentativa, setTentativa] = useState(0);
  // O diálogo não tem gatilho (o botão mora no cabeçalho do casco): guarda
  // quem o abriu, para devolver o foco ao fechar.
  const origemDaNova = useRef<HTMLElement | null>(null);
  const [gerando, setGerando] = useState<string | null>(null);
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  const abrirNova = useCallback(() => {
    origemDaNova.current = document.activeElement as HTMLElement | null;
    setNome('');
    mostrarErros([]);
    setErroNova(null);
    setCriada(null);
    setNovaAberta(true);
  }, [mostrarErros]);

  const acoes = useMemo(() => <Button onClick={abrirNova}>Nova agente</Button>, [abrirNova]);
  useCabecalho('Agentes', acoes);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    api.get<Agente[]>('/agentes')
      .then((r) => { if (ativo) setAgentes(r); })
      .catch((e) => { if (ativo) setErro(mensagemDeFalha(e, 'Não foi possível carregar as agentes. Tente de novo.')); });
    return () => { ativo = false; };
  }, [tentativa]);

  const substituir = (agente: Agente) =>
    setAgentes((lista) => [...(lista ?? []).filter((a) => a.id !== agente.id), agente].sort(porNome));

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!mostrarErros(nome.trim() ? [] : [{ id: ID_NOME_AGENTE, mensagem: 'Informe o nome da agente.' }])) return;
    setSalvando(true);
    setErroNova(null);
    try {
      const agente = await api.post<Agente>('/agentes', { nome: nome.trim() });
      substituir(agente);
      setCriada(agente);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.status === 400) mostrarErros([{ id: ID_NOME_AGENTE, mensagem: falha.message }]);
      else setErroNova(mensagem(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function gerarConvite(agente: Agente) {
    setGerando(agente.id);
    setErroConvite(null);
    try {
      substituir(await api.post<Agente>(`/agentes/${agente.id}/novo-convite`));
    } catch (falha) {
      setErroConvite(mensagem(falha));
    } finally {
      setGerando(null);
    }
  }

  const fecharNova = useCallback(() => setNovaAberta(false), []);

  return (
    // data-preflight: o reset do Tailwind vale nesta tela. Ver tailwind.css.
    <section data-preflight className="grid min-w-0 gap-6">
      <p className={APOIO}>
        Agentes de saúde que enviam pré-cadastros pelo app. Cada uma ativa o celular com um código de
        seis dígitos, que vale uma vez.
      </p>

      {erro && agentes === null && <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />}
      {erroConvite && <Aviso tom="erro" titulo="Não deu para gerar o código">{erroConvite}</Aviso>}

      {!erro && agentes === null && <Carregando mensagem="Carregando agentes" />}

      {agentes?.length === 0 && <p className={APOIO}>Nenhuma agente cadastrada ainda.</p>}

      {agentes && agentes.length > 0 && (
        <div className="grid gap-3">
          {paginarNoCliente(agentes, pagina, porPagina).map((a) => (
            <Card
              key={a.id}
              className="flex-row flex-wrap items-center justify-between gap-4 px-6 py-4 text-[1rem] celular:p-4"
            >
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-bold text-foreground">{a.nome}</p>
                  {a.codigoConvite ? (
                    <Badge
                      variant="outline"
                      className="h-6 border-dashed border-estrato-pendente-border bg-estrato-pendente font-semibold text-estrato-pendente-foreground"
                    >
                      <ClockIcon aria-hidden="true" />
                      Esperando ativação
                    </Badge>
                  ) : a.ativadoEm ? (
                    <Badge className="h-6 bg-success/10 font-semibold text-success">
                      <CheckIcon aria-hidden="true" />
                      Celular ativo
                    </Badge>
                  ) : null}
                </div>
                {a.codigoConvite ? (
                  <Codigo codigo={a.codigoConvite} nome={a.nome} />
                ) : a.ativadoEm ? (
                  <p className={APOIO}>desde {dataHora(a.ativadoEm)}</p>
                ) : null}
              </div>
              {/* Só pergunta quando há celular ativo: é ele que para de enviar. */}
              <ConfirmarAcao
                dispensar={!a.ativadoEm}
                destrutivo
                gatilho={
                  <Button
                    type="button"
                    variant="outline"
                    className="celular:w-full"
                    disabled={gerando === a.id}
                    aria-label={gerando === a.id ? undefined : `Gerar novo código para ${a.nome}`}
                  >
                    {gerando === a.id ? 'Gerando…' : 'Gerar novo código'}
                  </Button>
                }
                titulo="Gerar novo código?"
                descricao={
                  <>
                    O celular atual de <strong>{a.nome}</strong> para de enviar na hora. Os cadastros que ela
                    já enviou continuam ligados a ela.
                  </>
                }
                rotuloConfirmar="Gerar novo código"
                onConfirmar={() => gerarConvite(a)}
              />
            </Card>
          ))}
        </div>
      )}

      {agentes && agentes.length > 0 && (
        <Paginacao
          rotulo="agentes"
          pagina={pagina}
          porPagina={porPagina}
          total={agentes.length}
          onPagina={setPagina}
          onPorPagina={(n) => { setPorPagina(n); setPagina(0); }}
        />
      )}

      <Dialog open={novaAberta} onOpenChange={(aberto) => !aberto && fecharNova()}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            if (!origemDaNova.current?.isConnected) return;
            e.preventDefault();
            origemDaNova.current.focus();
          }}
          className="gap-5 p-6 sm:max-w-[560px] celular:p-4"
        >
          <DialogHeader className="flex-row items-center justify-between gap-3">
            <DialogTitle className="text-[1.4rem] leading-tight font-extrabold">
              {criada ? 'Agente cadastrada' : 'Nova agente'}
            </DialogTitle>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Fechar modal" className="shrink-0">
                <XIcon aria-hidden="true" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {criada?.codigoConvite ? (
            <div className="grid gap-4">
              <p className={APOIO}>
                Abra o app no celular de <strong>{criada.nome}</strong> e digite este código na tela de
                ativação. Ele vale uma vez.
              </p>
              <Codigo codigo={criada.codigoConvite} nome={criada.nome} />
              <div className="flex flex-wrap justify-end gap-3">
                <Button onClick={fecharNova}>Pronto</Button>
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={cadastrar} noValidate>
              <Campo
                id={ID_NOME_AGENTE}
                rotulo="Nome da agente"
                ajuda="Como o app vai mostrar para ela."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                erro={validacao.erroDe(ID_NOME_AGENTE)}
                maxLength={120}
                required
                autoFocus
              />
              <ResumoErros erros={validacao.resumo} />
              {erroNova && <Aviso tom="erro">{erroNova}</Aviso>}
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" type="button" onClick={fecharNova}>Cancelar</Button>
                <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Cadastrar e gerar código'}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
