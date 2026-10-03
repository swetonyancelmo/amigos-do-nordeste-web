'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Modal } from '@/componentes/Modal';
import { Paginacao, paginarNoCliente } from '@/componentes/Paginacao';
import { api, ErroApi } from '@/lib/api';
import { dataHora } from '@/lib/datas';
import type { Agente } from '@/tipos/dominio';
import estilos from './agentes.module.css';

const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Não foi possível concluir a operação.');

const porNome = (a: Agente, b: Agente) => a.nome.localeCompare(b.nome, 'pt-BR');

/** "472916" → "472 916". O app ignora o espaço ao ativar. */
const agrupado = (codigo: string) => `${codigo.slice(0, 3)} ${codigo.slice(3)}`;

function Codigo({ codigo }: { codigo: string }) {
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
    <div className={estilos.codigoLinha}>
      <span className={estilos.codigo} aria-label={`Código ${codigo.split('').join(' ')}`}>
        {agrupado(codigo)}
      </span>
      <Botao variante="secundario" type="button" onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar'}
      </Botao>
      <span className="so-leitor-de-tela" role="status">{copiado ? 'Código copiado' : ''}</span>
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
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroNova, setErroNova] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState<Agente | null>(null);

  const [confirmar, setConfirmar] = useState<Agente | null>(null);
  const [gerando, setGerando] = useState<string | null>(null);
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  const abrirNova = useCallback(() => {
    setNome('');
    setErroNome(null);
    setErroNova(null);
    setCriada(null);
    setNovaAberta(true);
  }, []);

  const acoes = useMemo(() => <Botao onClick={abrirNova}>Nova agente</Botao>, [abrirNova]);
  useCabecalho('Agentes', acoes);

  useEffect(() => {
    let ativo = true;
    api.get<Agente[]>('/agentes')
      .then((r) => { if (ativo) setAgentes(r); })
      .catch((e) => { if (ativo) setErro(mensagem(e)); });
    return () => { ativo = false; };
  }, []);

  const substituir = (agente: Agente) =>
    setAgentes((lista) => [...(lista ?? []).filter((a) => a.id !== agente.id), agente].sort(porNome));

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErroNome('Informe o nome da agente.');
      return;
    }
    setSalvando(true);
    setErroNome(null);
    setErroNova(null);
    try {
      const agente = await api.post<Agente>('/agentes', { nome: nome.trim() });
      substituir(agente);
      setCriada(agente);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.status === 400) setErroNome(falha.message);
      else setErroNova(mensagem(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function gerarConvite(agente: Agente) {
    setConfirmar(null);
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
  const fecharConfirmar = useCallback(() => setConfirmar(null), []);

  return (
    <section className={estilos.pagina}>
      <p className="texto-apoio">
        Agentes de saúde que enviam pré-cadastros pelo app. Cada uma ativa o celular com um código de
        seis dígitos, que vale uma vez.
      </p>

      {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}
      {erroConvite && <Aviso tom="erro" titulo="Não deu para gerar o código">{erroConvite}</Aviso>}

      {!erro && agentes === null && <p className="texto-apoio" role="status">Carregando…</p>}

      {agentes?.length === 0 && <p className="texto-apoio">Nenhuma agente cadastrada ainda.</p>}

      {agentes && agentes.length > 0 && (
        <div className={estilos.cards}>
          {paginarNoCliente(agentes, pagina, porPagina).map((a) => (
            <div key={a.id} className={`cartao ${estilos.card}`}>
              <div className={estilos.cardCorpo}>
                <div className={estilos.cardTitulo}>
                  <p className={estilos.cardNome}>{a.nome}</p>
                  {a.codigoConvite ? (
                    <span className={`${estilos.selo} ${estilos.seloPendente}`}>Esperando ativação</span>
                  ) : a.ativadoEm ? (
                    <span className={`${estilos.selo} ${estilos.seloAtivo}`}>Celular ativo</span>
                  ) : null}
                </div>
                {a.codigoConvite ? (
                  <Codigo codigo={a.codigoConvite} />
                ) : a.ativadoEm ? (
                  <p className="texto-apoio">desde {dataHora(a.ativadoEm)}</p>
                ) : null}
              </div>
              <Botao
                variante="secundario"
                disabled={gerando === a.id}
                onClick={() => (a.ativadoEm ? setConfirmar(a) : gerarConvite(a))}
              >
                {gerando === a.id ? 'Gerando…' : 'Gerar novo código'}
              </Botao>
            </div>
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

      <Modal aberto={novaAberta} titulo={criada ? 'Agente cadastrada' : 'Nova agente'} onFechar={fecharNova}>
        {criada?.codigoConvite ? (
          <div className={estilos.modalCorpo}>
            <p className="texto-apoio">
              Abra o app no celular de <strong>{criada.nome}</strong> e digite este código na tela de
              ativação. Ele vale uma vez.
            </p>
            <Codigo codigo={criada.codigoConvite} />
            <div className={estilos.modalAcoes}>
              <Botao onClick={fecharNova}>Pronto</Botao>
            </div>
          </div>
        ) : (
          <form className={estilos.modalCorpo} onSubmit={cadastrar} noValidate>
            <Campo
              rotulo="Nome da agente"
              ajuda="Como o app vai mostrar para ela."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              erro={erroNome ?? undefined}
              maxLength={120}
              required
              autoFocus
            />
            {erroNova && <Aviso tom="erro">{erroNova}</Aviso>}
            <div className={estilos.modalAcoes}>
              <Botao variante="secundario" type="button" onClick={fecharNova}>Cancelar</Botao>
              <Botao type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Cadastrar e gerar código'}</Botao>
            </div>
          </form>
        )}
      </Modal>

      <Modal aberto={confirmar !== null} titulo="Gerar novo código?" onFechar={fecharConfirmar}>
        <div className={estilos.modalCorpo}>
          <p className="texto-apoio">
            O celular atual de <strong>{confirmar?.nome}</strong> para de enviar na hora. Os cadastros
            que ela já enviou continuam ligados a ela.
          </p>
          <div className={estilos.modalAcoes}>
            <Botao variante="secundario" onClick={fecharConfirmar}>Cancelar</Botao>
            <Botao onClick={() => confirmar && gerarConvite(confirmar)}>Gerar novo código</Botao>
          </div>
        </div>
      </Modal>
    </section>
  );
}
