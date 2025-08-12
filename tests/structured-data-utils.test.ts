/**
 * Testes unitários para utilitários de dados estruturados
 * Testam apenas as funções de normalização e validação
 */

import { describe, it, expect } from '@jest/globals'
import {
  normalizeStringArray,
  normalizeLanguages,
  normalizeSpecialties,
  validateStructuredPayload,
  safeStringify,
  safeJsonParse,
} from '../lib/structured-data-utils'

describe('Structured Data Utils Tests', () => {
  describe('normalizeStringArray', () => {
    it('should handle valid arrays', () => {
      const input = ['Português', 'Inglês']
      const result = normalizeStringArray(input, 'languages')

      expect(result.data).toEqual(['Português', 'Inglês'])
      expect(result.wasCorrupted).toBe(false)
    })

    it('should parse comma-separated strings', () => {
      const input = 'Português, Inglês, Espanhol'
      const result = normalizeStringArray(input, 'languages')

      expect(result.data).toEqual(['Português', 'Inglês', 'Espanhol'])
    })

    it('should parse JSON strings', () => {
      const input = '["Português", "Inglês"]'
      const result = normalizeStringArray(input, 'languages')

      expect(result.data).toEqual(['Português', 'Inglês'])
    })

    it('should handle double-escaped JSON', () => {
      const input = '"[\\"Português\\", \\"Inglês\\"]"'
      const result = normalizeStringArray(input, 'languages')

      expect(result.data).toEqual(['Português', 'Inglês'])
      expect(typeof result.wasCorrupted).toBe('boolean')
    })

    it('should handle empty inputs', () => {
      expect(normalizeStringArray(null).data).toEqual([])
      expect(normalizeStringArray(undefined).data).toEqual([])
      expect(normalizeStringArray('').data).toEqual([])
      expect(normalizeStringArray([]).data).toEqual([])
    })
  })

  describe('normalizeLanguages', () => {
    it('should normalize language codes', () => {
      const testCases = [
        { input: 'pt-BR, en-US', expected: ['pt-BR', 'en-US'] },
        { input: 'Português, Inglês', expected: ['Português', 'Inglês'] },
        { input: '["pt-BR", "en-US"]', expected: ['pt-BR', 'en-US'] },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = normalizeLanguages(input)
        expect(result).toEqual(expected)
      })
    })

    it('should handle complex language patterns', () => {
      const input = 'Português (Brasil), English (US), Español'
      const result = normalizeLanguages(input)

      expect(result).toContain('Português (Brasil)')
      expect(result).toContain('English (US)')
      expect(result).toContain('Español')
    })
  })

  describe('normalizeSpecialties', () => {
    it('should normalize medical specialties', () => {
      const testCases = [
        {
          input: 'Nutrição Esportiva, Emagrecimento',
          expected: ['Nutrição Esportiva', 'Emagrecimento'],
        },
        {
          input: '["Nutrição Clínica", "Nutrição Infantil"]',
          expected: ['Nutrição Clínica', 'Nutrição Infantil'],
        },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = normalizeSpecialties(input)
        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual(expected)
      })
    })

    it('should handle specialty variations', () => {
      const input = 'nutrição esportiva, EMAGRECIMENTO, Nutrição Clínica'
      const result = normalizeSpecialties(input)

      expect(result).toContain('nutrição esportiva')
      expect(result).toContain('EMAGRECIMENTO')
      expect(result).toContain('Nutrição Clínica')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const input = '{"name": "test", "value": 123}'
      const result = safeJsonParse(input)
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('should handle double-escaped JSON', () => {
      const input = '"{\\"name\\": \\"test\\"}"'
      const result = safeJsonParse(input)
      expect(result).toEqual({ name: 'test' })
    })

    it('should return original value for invalid JSON', () => {
      const input = 'not json'
      const result = safeJsonParse(input)
      expect(result).toBe(input)
    })

    it('should handle arrays', () => {
      const input = '["item1", "item2"]'
      const result = safeJsonParse(input)
      expect(result).toEqual(['item1', 'item2'])
    })

    it('should handle non-string inputs', () => {
      expect(safeJsonParse(123)).toBe(123)
      expect(safeJsonParse(null)).toBe(null)
      expect(safeJsonParse(undefined)).toBe(undefined)
      expect(safeJsonParse({})).toEqual({})
    })
  })

  describe('safeStringify', () => {
    it('should stringify objects', () => {
      const input = { name: 'test', value: 123 }
      const result = safeStringify(input)
      expect(result).toBe('{"name":"test","value":123}')
    })

    it('should handle arrays', () => {
      const input = ['item1', 'item2']
      const result = safeStringify(input)
      expect(result).toBe('["item1","item2"]')
    })

    it('should handle basic types', () => {
      expect(safeStringify('string')).toBe('string') // Strings não são serializadas novamente
      expect(safeStringify(123)).toBe('123')
      expect(safeStringify(true)).toBe('true')
      expect(safeStringify(null)).toBe('null')
    })

    it('should handle objects and arrays', () => {
      expect(safeStringify({ name: 'test' })).toBe('{"name":"test"}')
      expect(safeStringify([1, 2, 3])).toBe('[1,2,3]')
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }
      obj.self = obj

      const result = safeStringify(obj)
      expect(typeof result).toBe('string')
      // Deve retornar uma string válida, mesmo com referência circular
      expect(result).toBe('[object Object]')
    })
  })

  describe('validateStructuredPayload', () => {
    it('should validate valid array payload', () => {
      const payload = { specialties: ['Nutrição Esportiva', 'Emagrecimento'] }
      const result = validateStructuredPayload(payload, 'specialties')

      expect(result.isValid).toBe(true)
      expect(result.data.specialties).toEqual([
        'Nutrição Esportiva',
        'Emagrecimento',
      ])
    })

    it('should reject JSON string payload', () => {
      const payload = { specialties: '["Nutrição Esportiva", "Emagrecimento"]' }
      const result = validateStructuredPayload(payload, 'specialties')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('string que parece JSON')
    })

    it('should validate null/undefined values', () => {
      const payload1 = { specialties: null }
      const payload2 = { specialties: undefined }

      expect(validateStructuredPayload(payload1, 'specialties').isValid).toBe(
        true
      )
      expect(validateStructuredPayload(payload2, 'specialties').isValid).toBe(
        true
      )
    })

    it('should reject corrupted data patterns', () => {
      // Usando um padrão que realmente corresponde aos RISK_PATTERNS
      const payload = { specialties: '\\\\\\\\["test"]' } // Múltiplos backslashes seguidos de colchetes
      const result = validateStructuredPayload(payload, 'specialties')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('múltiplos escapes')
    })

    it('should reject invalid payload types', () => {
      const result1 = validateStructuredPayload(null, 'specialties')
      expect(result1.isValid).toBe(false)
      expect(result1.error).toBe('Payload inválido')

      const result2 = validateStructuredPayload('string', 'specialties')
      expect(result2.isValid).toBe(false)
      expect(result2.error).toBe('Payload inválido')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON gracefully', () => {
      const malformedInputs = [
        '{"incomplete": ',
        '[1,2,3',
        '{"key": "value"',
        'not json at all',
      ]

      malformedInputs.forEach(input => {
        expect(() => normalizeStringArray(input)).not.toThrow()
        expect(() => safeJsonParse(input)).not.toThrow()
      })
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const result = normalizeStringArray(longString)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle special characters', () => {
      const specialChars = ['Açaí', 'Coração', 'Ñutrición', '中文', '🥗']
      const result = normalizeStringArray(specialChars)
      expect(result.data).toEqual(specialChars)
    })
  })
})
