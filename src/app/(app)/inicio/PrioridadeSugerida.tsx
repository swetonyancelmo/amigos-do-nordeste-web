'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Carregando, FalhaAoCarregar, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { DistribuicaoEstratos } from '@/componentes/vulnerabilidade/DistribuicaoEstratos';
import { api } from '@/lib/api';
import { FRASE_SUGESTAO } from '@/lib/vulnerabilidade';
import type { RelatorioVulnerabilidade } from '@/tipos/dominio';
import styles from './prioridade.module.css';

/**
 * Distribuição das famílias pela prioridade sugerida (ADR-0010 da API), com o
 * mesmo filtro de município/comunidade do resto do Início.
 *
 * O número de cadastros a completar é um LINK para a lista já filtrada: é o
 * que transforma um defeito do acervo em fila de trabalho.
 *
 * Nada disso vai para o mapa: pintar comunidade por estrato rotularia todo
 * mundo que mora lá (ADR-0005).
 */
export function PrioridadeSugerida({ municipioId, comunidadeId }: { municipioId: string; comunidadeId: string }) {
  const [relatorio, setRelatorio] = useState<RelatorioVulnerabilidade | null>(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  const filtro = new URLSearchParams();
  if (municipioId) filtro.set('municipioId', municipioId);
  if (comunidadeId) filtro.set('comunidadeId', comunidadeId);
  const consulta = filtro.toString();

  useEffect(() => {
    let ativo = true;
    setRelatorio(null);
    setErro('');
    api
      .get<RelatorioVulnerabilidade>(`/relatorios/vulnerabilidade${consulta ? `?${consulta}` : ''}`)
      .then((r) => ativo && setRelatorio(r))
      .catch((e) => ativo && setErro(mensagemDeFalha(e, 'Não foi possível carregar a prioridade sugerida. Tente de novo.')));
    return () => {
      ativo = false;
    };
  }, [consulta, tentativa]);

  const linkLista = (estrato: string) => {
    const p = new URLSearchParams(filtro);
    p.set('estrato', estrato);
    return `/familias?${p}`;
  };

  return (
    <section className={`cartao ${styles.secao}`} aria-labelledby="titulo-prioridade-sugerida">
      <div className={styles.topo}>
        <h2 id="titulo-prioridade-sugerida" className={styles.titulo}>Prioridade sugerida</h2>
        <Link href={`/priorizacao${consulta ? `?${consulta}` : ''}`} className={`${styles.abrir} nao-imprime`}>
          Abrir a priorização
        </Link>
      </div>

      {erro ? (
        <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />
      ) : !relatorio ? (
        <Carregando mensagem="Carregando a prioridade sugerida" linhas={5} />
      ) : relatorio.totalFamilias === 0 ? (
        <p className={styles.vazio}>Nenhuma família ativa neste recorte.</p>
      ) : (
        <>
          <p className={styles.frase}>{FRASE_SUGESTAO}</p>
          <DistribuicaoEstratos distribuicao={relatorio.distribuicao} linkPara={linkLista} />
        </>
      )}
    </section>
  );
}
