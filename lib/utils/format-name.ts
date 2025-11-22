export function formatNameProperCase(fullName?: string): string {
  if (!fullName) return ''
  const minorWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'di', 'du'])

  const normalizeToken = (token: string): string => {
    if (!token) return ''
    const lower = token.toLowerCase()
    if (minorWords.has(lower)) return lower
    // Trata nomes compostos com hífen (ex.: maria-clara)
    if (lower.includes('-')) {
      return lower
        .split('-')
        .map(p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
        .join('-')
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  return fullName
    .trim()
    .split(/\s+/)
    .map(normalizeToken)
    .join(' ')
}

