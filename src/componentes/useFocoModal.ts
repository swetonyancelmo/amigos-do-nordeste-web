import { useEffect, useRef, type RefObject } from 'react';

// Modais podem abrir um dentro do outro (ex.: fonte de renda dentro de
// pessoa). A pilha garante que o scroll da página só volta quando o último
// modal fecha, e que só o modal de cima responde ao Tab e ao Esc.
const pilha: HTMLElement[] = [];

const FOCAVEIS = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

type Opcoes = {
  aberto: boolean;
  /** O painel do diálogo: o Tab fica preso aqui dentro. */
  painel: RefObject<HTMLElement | null>;
  /** O elemento filho do <body> que contém o modal: o resto vira `inert`. */
  raiz: RefObject<HTMLElement | null>;
  /** Onde o foco entra se nenhum filho tiver `autoFocus` (ex.: botão de fechar). */
  focoInicial: RefObject<HTMLElement | null>;
  onFechar: () => void;
};

/**
 * Foco de diálogo modal (WCAG 2.4.3): ao abrir, o foco entra (no campo com
 * `autoFocus`, se houver; senão em `focoInicial`); Tab e Shift+Tab ficam
 * presos no painel; o resto da página vira `inert`; Esc fecha; ao fechar, o
 * foco volta para quem abriu.
 */
export function useFocoModal({ aberto, painel, raiz, focoInicial, onFechar }: Opcoes) {
  // Em ref para o efeito não rodar de novo quando a tela recria o callback
  // (rodar de novo puxaria o foco de volta para o foco inicial).
  const refOnFechar = useRef(onFechar);
  refOnFechar.current = onFechar;

  // "Quem abriu" é lido na renderização que abre, não no efeito: o React
  // aplica o `autoFocus` dos filhos antes dos efeitos, e aí o elemento ativo
  // já seria o campo de dentro do modal (que some ao fechar).
  const refOrigem = useRef<HTMLElement | null>(null);
  if (!aberto) {
    refOrigem.current = null;
  } else if (refOrigem.current === null && typeof document !== 'undefined') {
    refOrigem.current = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  }

  useEffect(() => {
    const elPainel = painel.current;
    const elRaiz = raiz.current;
    if (!aberto || !elPainel || !elRaiz) return;

    const origem = refOrigem.current;

    // Tudo fora deste modal sai do alcance do Tab e do leitor de tela.
    const travados: HTMLElement[] = [];
    for (const irmao of Array.from(document.body.children)) {
      if (irmao !== elRaiz && irmao instanceof HTMLElement && !irmao.inert) {
        irmao.inert = true;
        travados.push(irmao);
      }
    }

    if (!elPainel.contains(document.activeElement)) focoInicial.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (pilha[pilha.length - 1] !== elPainel) return;
      if (event.key === 'Escape') {
        refOnFechar.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focaveis = Array.from(elPainel.querySelectorAll<HTMLElement>(FOCAVEIS))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focaveis.length === 0) {
        event.preventDefault();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const atual = document.activeElement;
      if (event.shiftKey && (atual === primeiro || !elPainel.contains(atual))) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (atual === ultimo || !elPainel.contains(atual))) {
        event.preventDefault();
        primeiro.focus();
      }
    };

    pilha.push(elPainel);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      pilha.splice(pilha.indexOf(elPainel), 1);
      if (pilha.length === 0) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      for (const el of travados) el.inert = false;
      // Só devolve o foco se o modal saiu mesmo da tela. No modo estrito do
      // React o efeito é desmontado e montado de novo com o painel aberto, e
      // devolver aqui tiraria o foco do campo com `autoFocus`.
      if (!elPainel.isConnected && origem?.isConnected) origem.focus();
    };
  }, [aberto, painel, raiz, focoInicial]);
}
