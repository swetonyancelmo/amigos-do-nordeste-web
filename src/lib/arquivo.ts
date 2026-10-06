/**
 * Entrega um arquivo gerado na hora (planilha da API, PDF do relatório) como
 * download, sem abrir aba nova.
 */
export function salvarArquivo(conteudo: Blob, nome: string) {
  const endereco = URL.createObjectURL(conteudo);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Firefox cancela o download se a URL for revogada no mesmo instante.
  setTimeout(() => URL.revokeObjectURL(endereco), 1000);
}
