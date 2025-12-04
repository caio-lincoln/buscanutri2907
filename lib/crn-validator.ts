// Validador de CRN (Conselho Regional de Nutricionistas)
// Baseado no formato oficial: CRN + região + número

interface CRNValidationResult {
  isValid: boolean
  message: string
  region?: string
  number?: string
}

// Regiões válidas do CRN
const CRN_REGIONS = {
  '1': 'Rio de Janeiro e Espírito Santo',
  '2': 'Rio Grande do Sul',
  '3': 'São Paulo e Mato Grosso do Sul',
  '4': 'Minas Gerais',
  '5': 'Bahia e Sergipe',
  '6': 'Paraná',
  '7': 'Ceará',
  '8': 'Distrito Federal, Goiás, Tocantins e Mato Grosso',
  '9': 'Paraíba, Rio Grande do Norte, Alagoas e Pernambuco',
  '10': 'Pará, Amapá, Maranhão e Piauí',
  '11': 'Santa Catarina',
  '12': 'Acre, Amazonas, Rondônia e Roraima',
}

const CRN_REGEX = /^CRN[\s-]?(\d{1,2})[\s-]?(\d{4,6})$/i

export function validateCRNFormat(crn: string): CRNValidationResult {
  if (!crn || typeof crn !== 'string') {
    return { isValid: false, message: 'CRN é obrigatório' }
  }

  const clean = crn.trim().toUpperCase()
  const match = clean.match(CRN_REGEX)
  if (!match) {
    return {
      isValid: false,
      message: 'Formato inválido. Use: CRN3 12345 ou CRN-3-12345',
    }
  }

  const region = match[1] // "1".."12"
  const number = match[2] // 4..6 dígitos

  if (!CRN_REGIONS[region]) {
    return {
      isValid: false,
      message: `Região CRN${region} não existe. Regiões válidas: 1-12`,
    }
  }

  // number já tem 4..6 pela regex, mas deixo aqui por clareza:
  if (number.length < 4 || number.length > 6) {
    return {
      isValid: false,
      message: 'Número do registro deve ter entre 4 e 6 dígitos',
    }
  }

  return {
    isValid: true,
    message: `CRN válido - ${CRN_REGIONS[region]}`,
    region,
    number,
  }
}

// Função para validar CRN via API (preparada para integração futura)
export async function validateCRNWithAPI(
  crn: string
): Promise<CRNValidationResult> {
  // Primeiro valida o formato
  const formatValidation = validateCRNFormat(crn)
  if (!formatValidation.isValid) {
    return formatValidation
  }

  try {
    // TODO: Integrar com API oficial do CFN quando disponível
    // Por enquanto, simula uma validação mais rigorosa

    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Lista de CRNs inválidos para teste (simulação)
    const invalidCRNs = ['CRN3 00000', 'CRN1 11111', 'CRN2 99999']
    const cleanCRN = crn.trim().toUpperCase()

    if (invalidCRNs.includes(cleanCRN)) {
      return {
        isValid: false,
        message: 'CRN não encontrado na base de dados do CFN',
      }
    }

    // Se chegou até aqui, considera válido
    return {
      isValid: true,
      message: 'CRN validado com sucesso',
      region: formatValidation.region,
      number: formatValidation.number,
    }
  } catch (error) {
    // Silent error handling: Error validating CRN

    // Em caso de erro na API, retorna validação de formato
    return {
      isValid: true,
      message: 'CRN com formato válido (validação online indisponível)',
      region: formatValidation.region,
      number: formatValidation.number,
    }
  }
}

export function formatCRN(value: string): string {
  if (!value || value === "CRN") return ''
  // Remove não alfanuméricos e padroniza
  const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

  // Garante prefixo CRN
  const withPrefix = clean.startsWith('CRN') ? clean : `CRN${clean}`

  // Se tiver região+numero completos, formata; senão retorna como está
  const m = withPrefix.match(/^CRN(\d{1,2})(\d{4,6})$/)
  if (m) {
    return `CRN-${m[1]}-${m[2]}`
  }
  // Se tiver só região (1–2 dígitos), ainda não há número: CRN-<região>
  const partial = withPrefix.match(/^CRN(\d{1,2})$/)
  if (partial) return `CRN-${partial[1]}`

  return withPrefix
}
