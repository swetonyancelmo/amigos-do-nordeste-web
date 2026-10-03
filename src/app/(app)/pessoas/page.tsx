'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { ListaPessoas } from '@/componentes/pessoas/ListaPessoas';
import { ModalPessoa } from '@/componentes/pessoas/ModalPessoa';
import { Paginacao } from '@/componentes/Paginacao';
import { api } from '@/lib/api';
import type { Comunidade, Pagina, PessoaResumo } from '@/tipos/dominio';
import styles from './pessoas.module.css';

function IconeFiltro({ tipo }: { tipo: 'busca' | 'comunidade' | 'status' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {tipo === 'busca' && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>}
      {tipo === 'comunidade' && <><path d="m3 11 9-7 9 7" /><path d="M5 10v9h14v-9M9 19v-5h6v5" /></>}
      {tipo === 'status' && <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>}
    </svg>
  );
}

type Status = '' | 'incompleto' | 'completo';

/** null = modal fechado; '' = pessoa nova; id = editar. */
type Aberta = string | null;

export default function PessoasPage() {
  const [aberta, setAberta] = useState<Aberta>(null);
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [comunidadeId, setComunidadeId] = useState('');
  const [status, setStatus] = useState<Status>('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(20);
  const [recarga, setRecarga] = useState(0);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [dados, setDados] = useState<Pagina<PessoaResumo> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const acoes = useMemo(
    () => <Botao onClick={() => setAberta('')}>Nova pessoa</Botao>,
    [],
  );

  useCabecalho('Pessoas', acoes);

  useEffect(() => {
    api.get<Comunidade[]>('/comunidades').then(setComunidades).catch(() => setComunidades([]));
  }, []);

  // Espera a digitação parar antes de buscar; filtro novo volta à página 1.
  useEffect(() => {
    const espera = setTimeout(() => {
      setNome(busca.trim());
      setPagina(0);
    }, 300);
    return () => clearTimeout(espera);
  }, [busca]);

  useEffect(() => {
    let ativo = true;
    const query = new URLSearchParams({ pagina: String(pagina), tamanho: String(porPagina) });
    if (nome) query.set('nome', nome);
    if (comunidadeId) query.set('comunidadeId', comunidadeId);
    if (status) query.set('cadastroIncompleto', String(status === 'incompleto'));

    api.get<Pagina<PessoaResumo>>(`/pessoas?${query}`)
      .then((r) => { if (ativo) { setDados(r); setErro(null); } })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'); });
    return () => { ativo = false; };
  }, [nome, comunidadeId, status, pagina, porPagina, recarga]);

  const fechar = useCallback(() => setAberta(null), []);
  const salvo = useCallback(() => {
    setAberta(null);
    setRecarga((n) => n + 1);
  }, []);

  return (
    <main className={`${styles.pagina} pagina-pessoas`}>
      <section className={styles.conteudo}>
        <div className={styles.toolbar}>
          <div className={styles.busca}>
            <label className={styles.filtroRotulo} htmlFor="buscar-pessoa">
              <IconeFiltro tipo="busca" />
              Buscar por nome
            </label>
            <input
              id="buscar-pessoa"
              className={styles.filtroEntrada}
              placeholder="Digite o nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className={styles.filtrosInline}>
            <label className={styles.filtroCampo}>
              <span className={styles.filtroRotulo}><IconeFiltro tipo="comunidade" /> Comunidade</span>
              <select
                className={`${styles.filtroEntrada} ${styles.select}`}
                value={comunidadeId}
                onChange={(e) => { setComunidadeId(e.target.value); setPagina(0); }}
              >
                <option value="">Todas as comunidades</option>
                {comunidades.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} · {c.municipioNome}</option>
                ))}
              </select>
            </label>

            <label className={styles.filtroCampo}>
              <span className={styles.filtroRotulo}><IconeFiltro tipo="status" /> Status</span>
              <select
                className={`${styles.filtroEntrada} ${styles.select}`}
                value={status}
                onChange={(e) => { setStatus(e.target.value as Status); setPagina(0); }}
              >
                <option value="">Todos os status</option>
                <option value="incompleto">Cadastro incompleto</option>
                <option value="completo">Completo</option>
              </select>
            </label>
          </div>
        </div>

        {erro && <Aviso tom="erro" titulo="Não deu para carregar">{erro}</Aviso>}
        {!erro && dados === null && <p className="texto-apoio" role="status">Carregando…</p>}
        {dados?.itens.length === 0 && <p className="texto-apoio">Nenhuma pessoa encontrada.</p>}
        {dados && dados.itens.length > 0 && <ListaPessoas pessoas={dados.itens} onAbrir={setAberta} />}

        {dados && dados.total > 0 && (
          <Paginacao
            rotulo="pessoas"
            pagina={pagina}
            porPagina={porPagina}
            total={dados.total}
            onPagina={setPagina}
            onPorPagina={(n) => { setPorPagina(n); setPagina(0); }}
          />
        )}
      </section>

      <ModalPessoa
        aberto={aberta !== null}
        pessoaId={aberta || null}
        onFechar={fechar}
        onSalvo={salvo}
      />
    </main>
  );
}
