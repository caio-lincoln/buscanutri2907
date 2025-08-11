/**
 * Utilitário centralizado para normalização de campos estruturados
 * Previne problemas de múltiplos escapes e garante consistência de dados
 */

// Limite de tentativas de parse para evitar loops infinitos
const MAX_PARSE_ATTEMPTS = 5

// Padrões de risco que indicam múltiplos escapes
const RISK_PATTERNS = [
  /\\+"/g, // Múltiplos backslashes seguidos de aspas
  /\\+\[/g, // Múltiplos backslashes seguidos de colchetes
  /\\+\{/g, // Múltiplos backslashes seguidos de chaves
  /""\\?\[/g, // Aspas duplas seguidas de colchetes
  /\]""/g, // Colchetes seguidos de aspas duplas
]

// Idiomas conhecidos para detecção específica
const KNOWN_LANGUAGES = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Italiano',
  'Japonês',
  'Chinês',
  'Coreano',
  'Árabe',
  'Russo',
  'Hindi',
]

// Especialidades conhecidas para detecção específica
const KNOWN_SPECIALTIES = [
  'Nutrição Clínica',
  'Nutrição Esportiva',
  'Nutrição Funcional',
  'Nutrição Materno-Infantil',
  'Nutrição Geriátrica',
  'Nutrição Oncológica',
  'Nutrição Comportamental',
  'Fitoterapia',
  'Suplementação',
]

/**
 * Interface para resultado de normalização
 */
export interface NormalizationResult<T> {
  data: T
  wasCorrupted: boolean
  originalValue: unknown
  attempts: number
}

/**
 * Detecta se uma string contém padrões de risco (múltiplos escapes)
 */
export function hasRiskPatterns(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  return RISK_PATTERNS.some(pattern => pattern.test(value))
}

/**
 * Remove múltiplas camadas de escape de uma string
 */
function cleanEscapes(value: string): string {
  let cleaned = value
  let attempts = 0

  while (attempts < MAX_PARSE_ATTEMPTS && hasRiskPatterns(cleaned)) {
    // Remove escapes excessivos
    cleaned = cleaned
      .replace(/\\+"/g, '"')
      .replace(/\\+\[/g, '[')
      .replace(/\\+\{/g, '{')
      .replace(/\\+/g, '\\')
      .replace(/""\\?\[/g, '[')
      .replace(/\]""/g, ']')

    attempts++
  }

  return cleaned
}

/**
 * Tenta fazer parse de JSON com múltiplas tentativas
 */
export function safeJsonParse(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  let current: string = value
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    try {
      const parsed = JSON.parse(current)

      // Se conseguiu parsear e o resultado é diferente da string original
      if (parsed !== current) {
        if (typeof parsed === 'string') {
          current = parsed
          attempts++
          continue
        } else {
          return parsed
        }
      }

      // Se o resultado é igual à string original, parar
      break
    } catch {
      // Se falhou no parse, tentar limpar escapes
      const cleaned = cleanEscapes(current)
      if (cleaned === current) {
        // Se não conseguiu limpar mais, parar
        break
      }
      current = cleaned
      attempts++
    }
  }

  return current
}

/**
 * Normaliza um campo que deveria ser um array de strings
 */
export function normalizeStringArray(
  value: unknown
): NormalizationResult<string[]> {
  const originalValue = value
  let wasCorrupted = false
  const attempts = 0

  // Se já é um array, retorna como está
  if (Array.isArray(value)) {
    return {
      data: value.filter(
        item => typeof item === 'string' && item.trim() !== ''
      ),
      wasCorrupted: false,
      originalValue,
      attempts: 0,
    }
  }

  // Se não é string, retorna array vazio
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      data: [],
      wasCorrupted: false,
      originalValue,
      attempts: 0,
    }
  }

  const stringValue = value.trim()

  // Detecta se há padrões de risco
  if (hasRiskPatterns(stringValue)) {
    wasCorrupted = true
  }

  // Tenta fazer parse como JSON
  const parseResult = safeJsonParse(stringValue)

  if (parseResult && Array.isArray(parseResult)) {
    return {
      data: parseResult.filter(
        item => typeof item === 'string' && item.trim() !== ''
      ),
      wasCorrupted,
      originalValue,
      attempts,
    }
  }

  // Fallback: separa por vírgulas
  const fallbackResult = stringValue
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '' && item.length < 100) // Remove strings muito longas

  return {
    data: fallbackResult,
    wasCorrupted,
    originalValue,
    attempts,
  }
}

/**
 * Normaliza idiomas
 */
export function normalizeLanguages(input: unknown): string[] {
  const baseResult = normalizeStringArray(input)

  // Se o resultado base está vazio ou corrompido, tenta detecção por padrões
  if (baseResult.data.length === 0 || baseResult.wasCorrupted) {
    if (typeof input === 'string') {
      const detectedLanguages = KNOWN_LANGUAGES.filter(lang =>
        input.includes(lang)
      )

      if (detectedLanguages.length > 0) {
        return [...new Set(detectedLanguages)] // Remove duplicatas
      }
    }
  }

  return baseResult.data
}

/**
 * Normaliza especializações de nutricionistas
 */
export function normalizeSpecialties(input: unknown): string[] {
  const baseResult = normalizeStringArray(input)

  // Se o resultado base está vazio ou corrompido, tenta detecção por padrões
  if (baseResult.data.length === 0 || baseResult.wasCorrupted) {
    if (typeof input === 'string') {
      const detectedSpecialties = KNOWN_SPECIALTIES.filter(specialty =>
        input.toLowerCase().includes(specialty.toLowerCase())
      )

      if (detectedSpecialties.length > 0) {
        return [...new Set(detectedSpecialties)] // Remove duplicatas
      }
    }
  }

  return baseResult.data
}

/**
 * Normaliza um objeto JSON
 */
export function normalizeJsonObject<T = unknown>(
  value: unknown
): NormalizationResult<T | null> {
  const originalValue = value
  let wasCorrupted = false
  const attempts = 0

  // Se já é um objeto, retorna como está
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return {
      data: value as T,
      wasCorrupted: false,
      originalValue,
      attempts: 0,
    }
  }

  // Se não é string, retorna null
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      data: null,
      wasCorrupted: false,
      originalValue,
      attempts: 0,
    }
  }

  const stringValue = value.trim()

  // Detecta se há padrões de risco
  if (hasRiskPatterns(stringValue)) {
    wasCorrupted = true
  }

  // Tenta fazer parse como JSON
  const parseResult = safeJsonParse(stringValue)

  if (
    parseResult &&
    typeof parseResult === 'object' &&
    !Array.isArray(parseResult)
  ) {
    return {
      data: parseResult as T,
      wasCorrupted,
      originalValue,
      attempts,
    }
  }

  return {
    data: null,
    wasCorrupted,
    originalValue,
    attempts,
  }
}

/**
 * Serializa dados estruturados de forma segura (apenas uma vez)
 */
export function safeStringify(value: unknown): string {
  if (typeof value === 'string') {
    // Se já é string, não serializa novamente
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Valida se um payload contém dados estruturados válidos
 */
export function validateStructuredPayload(
  payload: unknown,
  fieldName: string
): {
  isValid: boolean
  error?: string
  normalizedValue?: unknown
} {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload inválido' }
  }

  const value = (payload as Record<string, unknown>)[fieldName]

  // Se é undefined ou null, é válido
  if (value === undefined || value === null) {
    return { isValid: true }
  }

  // Se é array ou objeto, é válido
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return { isValid: true, normalizedValue: value }
  }

  // Se é string que parece JSON, é inválido
  if (typeof value === 'string') {
    const trimmed = value.trim()

    // Detecta strings que parecem JSON
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      return {
        isValid: false,
        error: `Campo '${fieldName}' contém string que parece JSON. Envie array/objeto diretamente.`,
      }
    }

    // Detecta padrões de risco
    if (hasRiskPatterns(trimmed)) {
      return {
        isValid: false,
        error: `Campo '${fieldName}' contém múltiplos escapes. Dados podem estar corrompidos.`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Cria um backup do valor original antes da normalização
 */
export function createBackup(
  originalValue: unknown,
  fieldName: string
): {
  backupField: string
  backupValue: string
} {
  const timestamp = new Date().toISOString()
  return {
    backupField: `${fieldName}_raw_backup`,
    backupValue: JSON.stringify({
      originalValue,
      timestamp,
      reason: 'data_normalization',
    }),
  }
}

/**
 * Registra eventos de normalização para telemetria
 */
export function logNormalizationEvent(
  fieldName: string,
  originalValue: unknown,
  normalizedValue: unknown,
  wasCorrupted: boolean
): void {
  if (wasCorrupted) {
    // eslint-disable-next-line no-console
    console.warn(`[STRUCTURED_DATA] Campo ${fieldName} foi normalizado:`, {
      original: originalValue,
      normalized: normalizedValue,
      timestamp: new Date().toISOString(),
    })
  }
}
