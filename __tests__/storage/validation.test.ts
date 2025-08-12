import {
  validators,
  schemas,
  validateData,
  removeSensitiveData,
  containsSensitiveData
} from '../../lib/storage/validation'

describe('Storage Validation', () => {
  describe('validators', () => {
    test('string validator deve funcionar corretamente', () => {
      expect(validators.string('test')).toBe('test')
      expect(validators.string('')).toBe('')
      expect(validators.string(123)).toBe(null)
      expect(validators.string(null)).toBe(null)
      expect(validators.string(undefined)).toBe(null)
    })

    test('number validator deve funcionar corretamente', () => {
      expect(validators.number(123)).toBe(123)
      expect(validators.number(0)).toBe(0)
      expect(validators.number(-123)).toBe(-123)
      expect(validators.number(123.45)).toBe(123.45)
      expect(validators.number('123')).toBe(null)
      expect(validators.number(null)).toBe(null)
      expect(validators.number(NaN)).toBe(null)
    })

    test('boolean validator deve funcionar corretamente', () => {
      expect(validators.boolean(true)).toBe(true)
      expect(validators.boolean(false)).toBe(false)
      expect(validators.boolean('true')).toBe(null)
      expect(validators.boolean(1)).toBe(null)
      expect(validators.boolean(0)).toBe(null)
    })
  })

  describe('schemas', () => {
    test('userProfile schema deve estar definido', () => {
      expect(schemas.userProfile).toBeDefined()
      expect(typeof schemas.userProfile.validate).toBe('function')
    })

    test('appPreferences schema deve estar definido', () => {
      expect(schemas.appPreferences).toBeDefined()
      expect(typeof schemas.appPreferences.validate).toBe('function')
    })

    test('cacheEntry schema deve estar definido', () => {
      expect(schemas.cacheEntry).toBeDefined()
      expect(typeof schemas.cacheEntry.validate).toBe('function')
    })

    test('sessionData schema deve estar definido', () => {
      expect(schemas.sessionData).toBeDefined()
      expect(typeof schemas.sessionData.validate).toBe('function')
    })
  })

  describe('validateData', () => {
    test('deve validar dados com schema válido', () => {
      const data = {
        id: 'user123',
        email: 'user@test.com',
        name: 'Test User',
        user_type: 'client',
        created_at: '2023-01-01'
      }

      const result = validateData(data, schemas.userProfile)
      expect(result).not.toBe(null)
    })

    test('deve retornar null para dados inválidos', () => {
      const data = {
        id: 123, // Inválido - deve ser string
        email: 'user@test.com'
        // user_type ausente
      }

      const result = validateData(data, schemas.userProfile)
      expect(result).toBe(null)
    })

    test('deve funcionar com dados válidos de preferências', () => {
      const data = {
        theme: 'dark',
        language: 'pt',
        notifications: true,
        autoSave: false
      }

      const result = validateData(data, schemas.appPreferences)
      expect(result).not.toBe(null)
    })
  })

  describe('containsSensitiveData', () => {
    test('deve detectar dados sensíveis', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'abc123',
        api_key: 'key123',
        secret: 'hidden'
      }

      expect(containsSensitiveData(sensitiveData)).toBe(true)
    })

    test('deve detectar dados sensíveis em objetos aninhados', () => {
      const nestedData = {
        user: {
          name: 'Test',
          auth: {
            password: 'secret123'
          }
        }
      }

      expect(containsSensitiveData(nestedData)).toBe(true)
    })

    test('deve retornar false para dados seguros', () => {
      const safeData = {
        name: 'Test User',
        email: 'test@example.com',
        preferences: {
          theme: 'dark'
        }
      }

      expect(containsSensitiveData(safeData)).toBe(false)
    })

    test('deve tratar valores primitivos', () => {
      expect(containsSensitiveData('string')).toBe(false)
      expect(containsSensitiveData(123)).toBe(false)
      expect(containsSensitiveData(true)).toBe(false)
      expect(containsSensitiveData(null)).toBe(false)
    })
  })

  describe('removeSensitiveData', () => {
    test('deve remover dados sensíveis', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
        token: 'abc123'
      }

      const sanitized = removeSensitiveData(data)
      expect(sanitized.name).toBe('Test User')
      expect(sanitized.email).toBe('test@example.com')
      expect(sanitized.password).toBeUndefined()
      expect(sanitized.token).toBeUndefined()
    })

    test('deve remover dados sensíveis de objetos aninhados', () => {
      const data = {
        user: {
          name: 'Test',
          auth: {
            password: 'secret123',
            token: 'abc123'
          }
        },
        settings: {
          theme: 'dark'
        }
      }

      const sanitized = removeSensitiveData(data)
      expect(sanitized.user.name).toBe('Test')
      expect(sanitized.user.auth.password).toBeUndefined()
      expect(sanitized.user.auth.token).toBeUndefined()
      expect(sanitized.settings.theme).toBe('dark')
    })

    test('deve retornar dados seguros inalterados', () => {
      const safeData = {
        name: 'Test User',
        email: 'test@example.com',
        preferences: {
          theme: 'dark'
        }
      }

      const sanitized = removeSensitiveData(safeData)
      expect(sanitized).toEqual(safeData)
    })

    test('deve tratar valores primitivos', () => {
      expect(removeSensitiveData('string')).toBe('string')
      expect(removeSensitiveData(123)).toBe(123)
      expect(removeSensitiveData(true)).toBe(true)
      expect(removeSensitiveData(null)).toBe(null)
    })
  })
})