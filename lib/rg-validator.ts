// Validador de RG (Registro Geral)
// Implementa validação básica de RG brasileiro

interface RGValidationResult {
  isValid: boolean
  message: string
  formatted?: string
}

// Função para validar RG
export function validateRG(rg: string): RGValidationResult {
  if (!rg || typeof rg !== "string") {
    return {
      isValid: false,
      message: "RG é obrigatório",
    }
  }

  // Remove caracteres não alfanuméricos
  const cleanRG = rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  // Verifica se tem pelo menos 7 caracteres (mínimo para RG)
  if (cleanRG.length < 7) {
    return {
      isValid: false,
      message: "RG deve ter pelo menos 7 caracteres",
    }
  }

  // Verifica se tem no máximo 12 caracteres
  if (cleanRG.length > 12) {
    return {
      isValid: false,
      message: "RG deve ter no máximo 12 caracteres",
    }
  }

  // Verifica se contém pelo menos um número
  if (!/\d/.test(cleanRG)) {
    return {
      isValid: false,
      message: "RG deve conter pelo menos um número",
    }
  }

  // Verifica se todos os caracteres são iguais (RG inválido)
  if (/^(.)\1+$/.test(cleanRG)) {
    return {
      isValid: false,
      message: "RG inválido",
    }
  }

  return {
    isValid: true,
    message: "RG válido",
    formatted: formatRG(cleanRG),
  }
}

// Função para formatar RG
export function formatRG(rg: string): string {
  if (!rg) return ""

  // Remove caracteres especiais e converte para maiúsculo
  const clean = rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  // Aplica formatação básica para RGs de São Paulo (XX.XXX.XXX-X)
  if (clean.length <= 2) {
    return clean
  } else if (clean.length <= 5) {
    return clean.replace(/(\d{2})(\w{0,3})/, "$1.$2")
  } else if (clean.length <= 8) {
    return clean.replace(/(\d{2})(\d{3})(\w{0,3})/, "$1.$2.$3")
  } else {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\w{0,1})/, "$1.$2.$3-$4")
  }
}

// Função para validar formato de RG
export function validateRGFormat(rg: string): RGValidationResult {
  if (!rg || typeof rg !== "string") {
    return {
      isValid: false,
      message: "RG é obrigatório",
    }
  }

  // Remove espaços
  const trimmedRG = rg.trim()

  // Verifica se está vazio após trim
  if (!trimmedRG) {
    return {
      isValid: false,
      message: "RG é obrigatório",
    }
  }

  return validateRG(trimmedRG)
}

// Função para limpar RG (remover formatação)
export function cleanRG(rg: string): string {
  return rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

// Função para validar RG de São Paulo (com dígito verificador)
export function validateRGSP(rg: string): RGValidationResult {
  const cleanRG = cleanRG(rg)
  
  // RG de SP tem 9 dígitos (8 + 1 verificador)
  if (cleanRG.length !== 9) {
    return validateRG(rg) // Fallback para validação geral
  }

  // Extrai os 8 primeiros dígitos
  const digits = cleanRG.substring(0, 8)
  const checkDigit = cleanRG.substring(8, 9)

  // Verifica se os 8 primeiros são números
  if (!/^\d{8}$/.test(digits)) {
    return validateRG(rg) // Fallback para validação geral
  }

  // Calcula o dígito verificador
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += parseInt(digits.charAt(i)) * (9 - i)
  }

  const remainder = sum % 11
  let calculatedDigit: string

  if (remainder < 2) {
    calculatedDigit = "0"
  } else {
    calculatedDigit = (11 - remainder).toString()
  }

  // O dígito verificador pode ser X quando o resultado é 10
  if (calculatedDigit === "10") {
    calculatedDigit = "X"
  }

  if (checkDigit !== calculatedDigit) {
    return {
      isValid: false,
      message: "RG inválido (dígito verificador incorreto)",
    }
  }

  return {
    isValid: true,
    message: "RG válido",
    formatted: formatRG(cleanRG),
  }
}
