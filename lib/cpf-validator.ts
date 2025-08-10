// Validador de CPF (Cadastro de Pessoas Físicas)
// Implementa a validação oficial do CPF brasileiro

interface CPFValidationResult {
  isValid: boolean
  message: string
  formatted?: string
}

// Função para validar CPF
export function validateCPF(cpf: string): CPFValidationResult {
  if (!cpf || typeof cpf !== 'string') {
    return {
      isValid: false,
      message: 'CPF é obrigatório',
    }
  }

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      message: 'CPF deve ter 11 dígitos',
    }
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return {
      isValid: false,
      message: 'CPF inválido',
    }
  }

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return {
      isValid: false,
      message: 'CPF inválido',
    }
  }

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return {
      isValid: false,
      message: 'CPF inválido',
    }
  }

  return {
    isValid: true,
    message: 'CPF válido',
    formatted: formatCPF(cleanCPF),
  }
}

// Função para formatar CPF
export function formatCPF(cpf: string): string {
  if (!cpf) return ''

  // Remove tudo que não é número
  const clean = cpf.replace(/\D/g, '')

  // Aplica a máscara XXX.XXX.XXX-XX
  if (clean.length <= 3) {
    return clean
  } else if (clean.length <= 6) {
    return clean.replace(/(\d{3})(\d{0,3})/, '$1.$2')
  } else if (clean.length <= 9) {
    return clean.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
  } else {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
  }
}

// Função para validar formato de CPF
export function validateCPFFormat(cpf: string): CPFValidationResult {
  if (!cpf || typeof cpf !== 'string') {
    return {
      isValid: false,
      message: 'CPF é obrigatório',
    }
  }

  // Remove espaços
  const trimmedCPF = cpf.trim()

  // Verifica formato básico: XXX.XXX.XXX-XX ou apenas números
  const cpfRegex = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/
  if (!cpfRegex.test(trimmedCPF)) {
    return {
      isValid: false,
      message: 'Formato de CPF inválido. Use XXX.XXX.XXX-XX',
    }
  }

  return validateCPF(trimmedCPF)
}

// Função para limpar CPF (remover formatação)
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}
