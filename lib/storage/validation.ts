import { ValidationSchema } from './types'

/**
 * Sistema de validação para dados do storage
 */

// Validadores básicos
export const validators = {
  string: (value: unknown): string | null => {
    return typeof value === 'string' ? value : null
  },

  number: (value: unknown): number | null => {
    return typeof value === 'number' && !isNaN(value) ? value : null
  },

  boolean: (value: unknown): boolean | null => {
    return typeof value === 'boolean' ? value : null
  },

  array: <T>(itemValidator: (item: unknown) => T | null) => (value: unknown): T[] | null => {
    if (!Array.isArray(value)) return null
    
    const validatedItems: T[] = []
    for (const item of value) {
      const validatedItem = itemValidator(item)
      if (validatedItem !== null) {
        validatedItems.push(validatedItem)
      }
    }
    return validatedItems
  },

  object: <T extends Record<string, any>>(
    schema: { [K in keyof T]: (value: unknown) => T[K] | null | undefined }
  ) => (value: unknown): T | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    
    const obj = value as Record<string, unknown>
    const result = {} as T
    
    for (const [key, validator] of Object.entries(schema)) {
      const validatedValue = validator(obj[key])
      // Se o validator retorna undefined, é um campo opcional ausente
      if (validatedValue === undefined) {
        continue
      }
      // Se retorna null, é um erro de validação
      if (validatedValue === null) {
        return null
      }
      result[key as keyof T] = validatedValue
    }
    
    return result
  },

  optional: <T>(validator: (value: unknown) => T | null) => (value: unknown): T | null | undefined => {
    if (value === undefined || value === null) return undefined
    return validator(value)
  }
}

// Schemas de validação para tipos específicos da aplicação
export const schemas = {
  userProfile: {
    validate: validators.object({
      id: validators.string,
      email: validators.string,
      name: validators.optional(validators.string),
      user_type: validators.string,
      created_at: validators.string,
      updated_at: validators.optional(validators.string)
    }),
    sanitize: (data: any) => {
      // Remove campos sensíveis que não devem ser armazenados
      const { password, access_token, refresh_token, ...sanitized } = data
      return sanitized
    }
  } as ValidationSchema,

  appPreferences: {
    validate: validators.object({
      theme: validators.optional(validators.string),
      language: validators.optional(validators.string),
      notifications: validators.optional(validators.boolean),
      autoSave: validators.optional(validators.boolean)
    })
  } as ValidationSchema,

  cacheEntry: {
    validate: validators.object({
      data: (value: unknown) => value, // Aceita qualquer tipo para cache
      timestamp: validators.number,
      ttl: validators.optional(validators.number)
    }),
    sanitize: (data: any) => {
      // Remove dados expirados
      const now = Date.now()
      if (data.ttl && data.timestamp + data.ttl < now) {
        return null
      }
      return data
    }
  } as ValidationSchema,

  sessionData: {
    validate: validators.object({
      sessionId: validators.string,
      userId: validators.optional(validators.string),
      lastActivity: validators.number,
      data: validators.optional((value: unknown) => value)
    }),
    sanitize: (data: any) => {
      // Remove sessões expiradas (mais de 24 horas)
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 horas
      if (data.lastActivity + maxAge < now) {
        return null
      }
      return data
    }
  } as ValidationSchema
}

/**
 * Valida dados usando um schema específico
 */
export function validateData<T>(
  data: unknown,
  schema: ValidationSchema<T>
): T | null {
  try {
    const validated = schema.validate(data)
    if (validated === null) {
      return null
    }

    // Aplicar sanitização se disponível
    if (schema.sanitize) {
      const sanitized = schema.sanitize(validated)
      if (sanitized === null) {
        return null
      }
      return sanitized
    }

    return validated
  } catch (error) {
    console.warn('Erro durante validação:', error)
    return null
  }
}

/**
 * Verifica se um valor contém dados sensíveis que não devem ser armazenados
 */
export function containsSensitiveData(value: any): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'key',
    'private_key',
    'api_key',
    'auth_token',
    'session_token',
    'jwt',
    'bearer',
    'authorization',
    'credential',
    'pin',
    'ssn',
    'cpf',
    'cnpj',
    'credit_card',
    'card_number',
    'cvv',
    'security_code'
  ]

  const checkObject = (obj: any, path: string = ''): boolean => {
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key
      const lowerKey = key.toLowerCase()
      
      // Verificar se a chave contém termos sensíveis
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        console.warn(`Dados sensíveis detectados em: ${fullPath}`)
        return true
      }

      // Verificar recursivamente objetos aninhados
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (checkObject(val, fullPath)) {
          return true
        }
      }
    }
    return false
  }

  return checkObject(value)
}

/**
 * Remove dados sensíveis de um objeto
 */
export function removeSensitiveData(value: any): any {
  if (!value || typeof value !== 'object') {
    return value
  }

  const sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'key',
    'private_key',
    'api_key',
    'auth_token',
    'session_token',
    'jwt',
    'bearer',
    'authorization',
    'credential'
  ]

  const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanObject)
    }

    if (obj && typeof obj === 'object') {
      const cleaned: any = {}
      for (const [key, val] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        
        // Pular chaves sensíveis
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          continue
        }

        cleaned[key] = cleanObject(val)
      }
      return cleaned
    }

    return obj
  }

  return cleanObject(value)
}
