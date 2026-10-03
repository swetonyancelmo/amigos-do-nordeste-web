import { useEffect, useId } from 'react';

/**
 * Quantidades oferecidas no seletor. 100 é o teto da API (`POR_PAGINA_MAXIMO`
 * em famílias, `TAMANHO_MAXIMO` em pessoas): acima disso ela corta sozinha.
 */
export const TAMANHOS_PAGINA = [10, 20, 50, 100] as const;

type Props = {
  /** Página atual, começando em 0 (igual à API). */
  pagina: number;
  porPagina: number;
  /** Total de itens, de todas as páginas. */
  total: number;
  onPagina: (pagina: number) => void;
  /** Trocar o tamanho volta para a primeira página. */
  onPorPagina: (porPagina: number) => void;
  /** Para o leitor de tela: "Paginação da lista de {rotulo}". */
  rotulo: string;
};

const numero = (n: number) => n.toLocaleString('pt-BR');

function Seta({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

/**
 * Rodapé de lista: quantos itens por página, "1 a 20 de 315" e as setas de
 * primeira, anterior, próxima e última. Serve tanto para lista paginada pela
 * API quanto para lista que chega inteira (ver `paginarNoCliente`).
 */
export function Paginacao({ pagina, porPagina, total, onPagina, onPorPagina, rotulo }: Props) {
  const idTamanho = useId();
  const totalPaginas = Math.max(Math.ceil(total / porPagina), 1);
  const ultima = totalPaginas - 1;
  const primeiroItem = total === 0 ? 0 : pagina * porPagina + 1;
  const ultimoItem = Math.min((pagina + 1) * porPagina, total);
  const noInicio = pagina <= 0;
  const noFim = pagina >= ultima;

  // Removeu o último item da última página: volta para a que ainda existe.
  useEffect(() => {
    if (pagina > ultima) onPagina(ultima);
  }, [pagina, ultima, onPagina]);

  return (
    <nav className="paginacao" aria-label={`Paginação da lista de ${rotulo}`}>
      <div className="paginacao__tamanho">
        <label htmlFor={idTamanho}>Itens por página:</label>
        <select
          id={idTamanho}
          className="paginacao__selecao"
          value={porPagina}
          onChange={(e) => onPorPagina(Number(e.target.value))}
        >
          {TAMANHOS_PAGINA.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <span className="paginacao__intervalo" aria-live="polite">
        <strong>{numero(primeiroItem)}</strong> a <strong>{numero(ultimoItem)}</strong> de{' '}
        <strong>{numero(total)}</strong>
      </span>

      <div className="paginacao__controles">
        <button type="button" className="paginacao__botao" disabled={noInicio}
                onClick={() => onPagina(0)} aria-label="Primeira página" title="Primeira página">
          <Seta d="m17 18-6-6 6-6M7 6v12" />
        </button>
        <button type="button" className="paginacao__botao" disabled={noInicio}
                onClick={() => onPagina(pagina - 1)} aria-label="Página anterior" title="Página anterior">
          <Seta d="m15 18-6-6 6-6" />
        </button>
        <span className="paginacao__atual">
          Página <strong>{numero(pagina + 1)}</strong> de <strong>{numero(totalPaginas)}</strong>
        </span>
        <button type="button" className="paginacao__botao" disabled={noFim}
                onClick={() => onPagina(pagina + 1)} aria-label="Próxima página" title="Próxima página">
          <Seta d="m9 18 6-6-6-6" />
        </button>
        <button type="button" className="paginacao__botao" disabled={noFim}
                onClick={() => onPagina(ultima)} aria-label="Última página" title="Última página">
          <Seta d="m7 18 6-6-6-6M17 6v12" />
        </button>
      </div>
    </nav>
  );
}

/** Fatia de uma lista que a API devolve inteira (chamados, agentes). */
export function paginarNoCliente<T>(lista: T[], pagina: number, porPagina: number): T[] {
  return lista.slice(pagina * porPagina, (pagina + 1) * porPagina);
}
