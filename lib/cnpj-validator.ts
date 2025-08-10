// Validador de CNPJ com integração para APIs gratuitas
export interface CNPJValidationResult {
  isValid: boolean
  message: string
  companyData?: {
    name: string
    fantasyName?: string
    situation: string
    activity: string
  }
}

// Remove caracteres não numéricos do CNPJ
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

// Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj)

  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return cleaned.replace(/(\d{2})(\d+)/, '$1.$2')
  if (cleaned.length <= 8)
    return cleaned.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
  if (cleaned.length <= 12)
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')

  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  )
}

// Valida formato e dígitos verificadores do CNPJ
export function validateCNPJFormat(cnpj: string): CNPJValidationResult {
  const cleaned = cleanCNPJ(cnpj)

  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) {
    return {
      isValid: false,
      message: 'CNPJ deve conter 14 dígitos',
    }
  }

  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'CNPJ não pode ter todos os dígitos iguais',
    }
  }

  // Validação dos dígitos verificadores
  const digits = cleaned.split('').map(Number)

  // Primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weight
    weight = weight === 2 ? 9 : weight - 1
  }

  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (digits[12] !== firstDigit) {
    return {
      isValid: false,
      message: 'CNPJ inválido - primeiro dígito verificador incorreto',
    }
  }

  // Segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weight
    weight = weight === 2 ? 9 : weight - 1
  }

  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (digits[13] !== secondDigit) {
    return {
      isValid: false,
      message: 'CNPJ inválido - segundo dígito verificador incorreto',
    }
  }

  return {
    isValid: true,
    message: 'CNPJ válido',
  }
}

// Valida CNPJ via API da Receita Federal (ReceitaWS - gratuita)
export async function validateCNPJWithAPI(
  cnpj: string
): Promise<CNPJValidationResult> {
  const cleaned = cleanCNPJ(cnpj)

  try {
    // Usando ReceitaWS - API gratuita da Receita Federal
    const response = await fetch(
      `https://receitaws.com.br/v1/cnpj/${cleaned}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Erro na consulta à Receita Federal')
    }

    const data = await response.json()

    // Verifica se houve erro na API
    if (data.status === 'ERROR') {
      return {
        isValid: false,
        message: data.message || 'CNPJ não encontrado na Receita Federal',
      }
    }

    // Verifica situação da empresa
    const isActive = data.situacao === 'ATIVA'

    return {
      isValid: isActive,
      message: isActive
        ? `Empresa ativa: ${data.nome}`
        : `Empresa ${data.situacao.toLowerCase()}: ${data.nome}`,
      companyData: {
        name: data.nome,
        fantasyName: data.fantasia,
        situation: data.situacao,
        activity: data.atividade_principal?.[0]?.text || 'Não informado',
      },
    }
  } catch (error) {
    // Silent error handling: Error validating CNPJ

    // Fallback: se API falhar, usa apenas validação de formato
    const formatValidation = validateCNPJFormat(cnpj)

    if (formatValidation.isValid) {
      return {
        isValid: true,
        message: 'CNPJ válido',
      }
    }

    return {
      isValid: false,
      message: 'Erro ao validar CNPJ. Verifique o número e tente novamente.',
    }
  }
}

// Lista de CNPJs para teste (simulação)
const TEST_CNPJS = {
  // CNPJ válido mas empresa inativa (para teste)
  '11222333000181': {
    isValid: false,
    message: 'Empresa inativa: Empresa Teste Inativa Ltda',
  },
  // CNPJ válido e empresa ativa (para teste)
  '11444555000161': {
    isValid: true,
    message: 'Empresa ativa: Empresa Teste Ativa Ltda',
    companyData: {
      name: 'Empresa Teste Ativa Ltda',
      fantasyName: 'Teste Ativa',
      situation: 'ATIVA',
      activity: 'Atividades de consultoria em gestão empresarial',
    },
  },
}

// Função auxiliar para desenvolvimento/teste
export function isTestCNPJ(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj)
  return cleaned in TEST_CNPJS
}

// Simula resposta da API para CNPJs de teste
export function getTestCNPJResponse(cnpj: string): CNPJValidationResult | null {
  const cleaned = cleanCNPJ(cnpj)
  return TEST_CNPJS[cleaned as keyof typeof TEST_CNPJS] || null
}
