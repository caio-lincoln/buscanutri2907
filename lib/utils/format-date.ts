
export function formatDateBR(iso: string, tz = 'America/Sao_Paulo') {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}