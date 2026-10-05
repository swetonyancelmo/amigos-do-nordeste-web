'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Loading } from '@/componentes/Loading';
import { Modal } from '@/componentes/Modal';
import { Paginacao, paginarNoCliente } from '@/componentes/Paginacao';
import { api } from '@/lib/api';
import { useMetadados } from '@/lib/metadados';
import type { Comunidade, TipoComunidade } from '@/tipos/dominio';
import styles from './comunidades.module.css';

const ACOES = (
  <Link href="/comunidades/nova" className="botao botao--primario">
    Nova comunidade
  </Link>
);

const mensagemDeErro = (e: unknown) =>
  e instanceof Error ? e.message : 'Não foi possível carregar as comunidades.';

const normalizar = (valor: string | null | undefined) =>
  (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

const formatarCoordenada = (valor: number | null) =>
  valor === null ? '—' : valor.toLocaleString('pt-BR', { maximumFractionDigits: 6 });

function IconeBusca() {
  return (
    <svg
      className={styles.buscaIcone}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

export default function Comunidades() {
  useCabecalho('Comunidades', ACOES);
  const { metadados, erro: erroMetadados } = useMetadados();

  const [comunidades, setComunidades] = useState<Comunidade[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(20);
  const [selecionada, setSelecionada] = useState<Comunidade | null>(null);

  useEffect(() => {
    let ativa = true;
    api.get<Comunidade[]>('/comunidades')
      .then((dados) => { if (ativa) setComunidades(dados); })
      .catch((falha) => { if (ativa) setErro(mensagemDeErro(falha)); });
    return () => { ativa = false; };
  }, []);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return comunidades ?? [];
    return (comunidades ?? []).filter((comunidade) =>
      [comunidade.nome, comunidade.municipioNome, comunidade.liderNome]
        .some((valor) => normalizar(valor).includes(termo)),
    );
  }, [busca, comunidades]);

  const tipoComunidade = (tipo: TipoComunidade) =>
    metadados?.tipoComunidade.find((opcao) => opcao.valor === tipo)?.rotulo ?? tipo;

  return (
    <div className={styles.pagina}>
      <section className={styles.conteudo}>
        <p className={styles.resumo}>
          {comunidades
            ? `${filtradas.length.toLocaleString('pt-BR')} ${filtradas.length === 1 ? 'comunidade' : 'comunidades'}`
            : 'Carregando comunidades…'}
        </p>

        <div className={styles.busca}>
          <IconeBusca />
          <input
            className={styles.buscaEntrada}
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0);
            }}
            placeholder="Buscar por comunidade, município ou liderança…"
            aria-label="Buscar por comunidade, município ou liderança"
          />
        </div>

        {erro && <Aviso tom="erro">{erro}</Aviso>}
        {erroMetadados && <Aviso tom="erro" titulo="Não deu para carregar os tipos">{erroMetadados.message}</Aviso>}

        <div className={styles.cartaoTabela}>
          <div className={styles.tabelaRolagem} aria-busy={comunidades === null}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Comunidade</th>
                  <th>Tipo</th>
                  <th>Município</th>
                  <th>Liderança</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {paginarNoCliente(filtradas, pagina, porPagina).map((comunidade) => (
                  <tr key={comunidade.id}>
                    <td className={styles.celulaNome} data-rotulo="Comunidade">
                      <button
                        type="button"
                        className={styles.nomeBotao}
                        onClick={() => setSelecionada(comunidade)}
                      >
                        {comunidade.nome}
                      </button>
                    </td>
                    <td data-rotulo="Tipo">{tipoComunidade(comunidade.tipoComunidade)}</td>
                    <td data-rotulo="Município">{comunidade.municipioNome}</td>
                    <td data-rotulo="Liderança">{comunidade.liderNome ?? '—'}</td>
                    <td data-rotulo="Telefone">{comunidade.liderTelefone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comunidades === null && !erro && <Loading mensagem="Carregando comunidades…" tamanho="compacto" />}
          {comunidades && filtradas.length === 0 && (
            <p className={styles.estado}>
              {busca ? 'Nenhuma comunidade encontrada com essa busca.' : 'Nenhuma comunidade cadastrada.'}
            </p>
          )}
        </div>

        {comunidades && filtradas.length > 0 && (
          <Paginacao
            rotulo="comunidades"
            pagina={pagina}
            porPagina={porPagina}
            total={filtradas.length}
            onPagina={setPagina}
            onPorPagina={(quantidade) => {
              setPorPagina(quantidade);
              setPagina(0);
            }}
          />
        )}
      </section>

      <Modal
        aberto={selecionada !== null}
        titulo={selecionada?.nome ?? 'Comunidade'}
        onFechar={() => setSelecionada(null)}
      >
        {selecionada && (
          <>
            <section className={styles.secao}>
              <h3 className={styles.secaoTitulo}>Comunidade</h3>
              <dl className={styles.grade}>
                <Dado rotulo="Nome">{selecionada.nome}</Dado>
                <Dado rotulo="Tipo">{tipoComunidade(selecionada.tipoComunidade)}</Dado>
                <Dado rotulo="Município">{selecionada.municipioNome}</Dado>
                <Dado rotulo="Liderança">{selecionada.liderNome}</Dado>
                <Dado rotulo="Telefone">{selecionada.liderTelefone}</Dado>
                <Dado rotulo="Latitude">{formatarCoordenada(selecionada.latitude)}</Dado>
                <Dado rotulo="Longitude">{formatarCoordenada(selecionada.longitude)}</Dado>
                <Dado rotulo="Observações">{selecionada.observacoes}</Dado>
              </dl>
            </section>
          </>
        )}
      </Modal>
    </div>
  );
}
