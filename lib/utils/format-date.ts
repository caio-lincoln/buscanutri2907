
export function formatDateBR(iso: string, tz = 'America/Sao_Paulo') {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

export function formatDateOnlyBR(iso: string, tz = 'America/Sao_Paulo') {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatTimeOnlyBR(iso: string, tz = 'America/Sao_Paulo') {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

export function formatWeekdayBR(
  iso: string,
  tz = 'America/Sao_Paulo',
  length: 'short' | 'long' | 'narrow' = 'short'
) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    weekday: length,
  }).format(d)
}

function getBRDateParts(iso: string, tz = 'America/Sao_Paulo') {
  const formatted = formatDateOnlyBR(iso, tz) // dd/mm/yyyy
  const [dayStr, monthStr, yearStr] = formatted.split('/')
  return {
    day: parseInt(dayStr, 10),
    month: parseInt(monthStr, 10),
    year: parseInt(yearStr, 10),
  }
}

export function isSameDayBR(
  iso: string,
  referenceIso: string = new Date().toISOString(),
  tz = 'America/Sao_Paulo'
) {
  const a = getBRDateParts(iso, tz)
  const b = getBRDateParts(referenceIso, tz)
  return a.day === b.day && a.month === b.month && a.year === b.year
}

export function diffCalendarDaysBR(
  iso: string,
  referenceIso: string = new Date().toISOString(),
  tz = 'America/Sao_Paulo'
) {
  const a = getBRDateParts(iso, tz)
  const b = getBRDateParts(referenceIso, tz)
  const dA = new Date(a.year, a.month - 1, a.day)
  const dB = new Date(b.year, b.month - 1, b.day)
  const ms = dB.getTime() - dA.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
