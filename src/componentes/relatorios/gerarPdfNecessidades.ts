import { createElement } from 'react';
import { salvarArquivo } from '@/lib/arquivo';
import type { CoresPdf, DadosPdfNecessidades } from './PdfNecessidades';

/** Um token do globals.css, já resolvido (o PDF precisa da cor de fato, não de var(--x)). */
function token(nome: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/**
 * Monta o PDF do relatório de necessidades e baixa. A biblioteca e o layout
 * só são carregados aqui, no clique: quem não exporta não paga pelo peso.
 */
export async function gerarPdfNecessidades(dados: Omit<DadosPdfNecessidades, 'logo'>, nomeArquivo: string) {
  const [{ pdf }, { PdfNecessidades }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./PdfNecessidades'),
  ]);

  const cores: CoresPdf = {
    laranja: token('--laranja'),
    laranjaEscuro: token('--laranja-escuro'),
    laranjaClaro: token('--laranja-claro'),
    ambar: token('--ambar'),
    ambarClaro: token('--ambar-claro'),
    verde: token('--verde'),
    verdeClaro: token('--verde-claro'),
    textoForte: token('--texto-forte'),
    textoMedio: token('--texto-medio'),
    linha: token('--linha'),
    pagina: token('--pagina'),
  };

  const documento = createElement(PdfNecessidades, {
    dados: { ...dados, logo: `${window.location.origin}/logo-amigos-do-nordeste.jpeg` },
    cores,
  });
  // O tipo de pdf() espera um <Document> direto; PdfNecessidades devolve um.
  const conteudo = await pdf(documento as Parameters<typeof pdf>[0]).toBlob();
  salvarArquivo(conteudo, nomeArquivo);
}
