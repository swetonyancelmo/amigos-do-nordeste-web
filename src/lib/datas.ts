/** Formatação de data para a tela, sempre no fuso da associação. */

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Recife',
});

/** ISO com fuso (OffsetDateTime da API) → "30/09/2026 14:05". */
export function dataHora(iso: string | null | undefined): string {
  return iso ? DATA_HORA.format(new Date(iso)) : '—';
}

/** AAAA-MM-DD → DD/MM/AAAA, sem passar por Date (fuso não empurra o dia). */
export function data(aaaammdd: string | null | undefined): string {
  if (!aaaammdd) return '—';
  const [a, m, d] = aaaammdd.split('-');
  return `${d}/${m}/${a}`;
}
