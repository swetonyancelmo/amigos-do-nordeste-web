'use client';

import { useEffect, useState } from 'react';
import { Aviso } from './Aviso';
import { Botao } from './Botao';
import { ErroApi } from '@/lib/api';
import styles from './EstadoCarga.module.css';

/*
 * Estados de carga para telas que dependem da API.
 *
 * A API fica no plano gratuito do Render: depois de 15 minutos parada ela
 * dorme, e a primeira chamada leva perto de um minuto. Um "Carregando…" mudo
 * por um minuto parece travado, e a pessoa recarrega, o que não ajuda. Por
 * isso o esqueleto ganha, depois de alguns segundos, uma linha dizendo o que
 * está acontecendo.
 */

/** A partir de quando dizer que o servidor está acordando. */
const DEMORA_MS = 5_000;
/** A partir de quando reconhecer que está demorando mais que o normal. */
const MUITA_DEMORA_MS = 45_000;

function useTempoDecorrido(): number {
  const [inicio] = useState(() => Date.now());
  const [agora, setAgora] = useState(inicio);
  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 1_000);
    return () => clearInterval(relogio);
  }, []);
  return agora - inicio;
}

type PropsCarregando = {
  /** O que está carregando, para o leitor de tela e para quem espera ("Carregando famílias"). */
  mensagem: string;
  /** Quantas barras de esqueleto desenhar. */
  linhas?: number;
  /** Detalhe de progresso opcional ("3 de 12 comunidades"). */
  progresso?: string;
};

/**
 * Esqueleto com texto, nunca giro infinito mudo. Depois de 5 s explica que o
 * servidor pode estar acordando; depois de 45 s, que está demorando mais que
 * o normal, e que dá para esperar.
 */
export function Carregando({ mensagem, linhas = 4, progresso }: PropsCarregando) {
  const decorrido = useTempoDecorrido();

  let explicacao = '';
  if (decorrido >= MUITA_DEMORA_MS) {
    explicacao = 'Está demorando mais que o normal. Pode esperar mais um pouco; se não vier, aparece um botão para tentar de novo.';
  } else if (decorrido >= DEMORA_MS) {
    explicacao = 'O servidor estava em repouso e está acordando. Isso pode levar até um minuto; não precisa recarregar a página.';
  }

  return (
    <div className={styles.carregando} role="status" aria-live="polite" aria-busy="true">
      <p className={styles.mensagem}>
        {mensagem}…{progresso ? ` ${progresso}` : ''}
      </p>
      {explicacao && <p className={styles.explicacao}>{explicacao}</p>}
      <div className={styles.esqueleto} aria-hidden="true">
        {Array.from({ length: linhas }, (_, i) => (
          <span key={i} className={styles.barra} />
        ))}
      </div>
    </div>
  );
}

type PropsFalha = {
  /** O que falhou, em português e dizendo o que fazer. */
  mensagem: string;
  onTentarDeNovo: () => void;
};

/** Erro com saída: o texto diz o que houve e o botão tenta de novo. */
export function FalhaAoCarregar({ mensagem, onTentarDeNovo }: PropsFalha) {
  return (
    <div className={styles.falha}>
      <Aviso tom="erro" titulo="Não foi possível carregar">
        {mensagem}
      </Aviso>
      <Botao variante="secundario" onClick={onTentarDeNovo}>
        Tentar de novo
      </Botao>
    </div>
  );
}

/**
 * Texto de erro para a tela. Só a mensagem do `ErroApi` (escrita para a
 * usuária, em português) passa; qualquer outra exceção vira o texto padrão,
 * para nunca aparecer "[object Object]" nem mensagem crua de JavaScript.
 * Nada do erro vai para o console: ele pode carregar dado de família.
 */
export function mensagemDeFalha(erro: unknown, padrao: string): string {
  if (erro instanceof ErroApi && erro.message) {
    return erro.status === 0 || erro.status >= 500
      ? `${erro.message} Se o servidor estava parado, a primeira tentativa pode falhar: tente de novo.`
      : erro.message;
  }
  return padrao;
}
