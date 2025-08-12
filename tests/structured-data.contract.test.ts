/**
 * Testes de contrato para dados estruturados
 * Garantem que arrays/objetos sejam tratados corretamente do front-end ao banco
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  normalizeStringArray,
  normalizeLanguages,
  normalizeSpecialties,
  safeJsonParse,
  safeStringify,
  validateStructuredPayload,
} from '../lib/structured-data-utils'

// Mock do banco de dados para testes de contrato
const mockDatabase = {
  nutritionists: [] as any[],
  async save(data: any) {
    this.nutritionists.push(data)
    return { id: this.nutritionists.length, ...data }
  },
  async findById(id: number) {
    return this.nutritionists[id - 1] || null
  },
  clear() {
    this.nutritionists = []
  },
}

describe('Structured Data Contract Tests', () => {
  beforeEach(() => {
    mockDatabase.clear()
  })

  afterEach(() => {
    mockDatabase.clear()
  })

  describe('Array Field Normalization', () => {
    it('should normalize string arrays correctly', () => {
      const testCases = [
        // Array válido
        ['Português', 'Inglês'],
        // String com vírgulas
        'Português, Inglês',
        // JSON string
        '["Português", "Inglês"]',
        // JSON string com escapes
        '"[\\"Português\\", \\"Inglês\\"]"',
        // JSON string com múltiplos escapes
        '\\"[\\\\\\"Português\\\\\\", \\\\\\"Inglês\\\\\\"]\\\"',
      ]

      testCases.forEach(testCase => {
        const result = normalizeStringArray(testCase, 'languages')
        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual(['Português', 'Inglês'])
      })
    })

    it('should normalize languages with known patterns', () => {
      const testCases = [
        'pt-BR, en-US',
        'Português (Brasil), English (US)',
        '["pt-BR", "en-US"]',
        '"[\\"Português\\", \\"Inglês\\"]"',
      ]

      testCases.forEach(testCase => {
        const result = normalizeLanguages(testCase)
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    it('should normalize specialties with medical patterns', () => {
      const testCases = [
        'Nutrição Esportiva, Emagrecimento',
        '["Nutrição Esportiva", "Emagrecimento"]',
        '"[\\"Nutrição Esportiva\\", \\"Emagrecimento\\"]"',
      ]

      testCases.forEach(testCase => {
        const result = normalizeSpecialties(testCase)
        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual(['Nutrição Esportiva', 'Emagrecimento'])
      })
    })
  })

  describe('Payload Validation', () => {
    it('should reject payloads with JSON strings', () => {
      const invalidPayloads = [
        {
          languages: '["Português", "Inglês"]',
          specialties: ['Nutrição Esportiva'],
        },
        {
          languages: ['Português'],
          specialties: '"[\\"Nutrição Esportiva\\"]"',
        },
        {
          services: '{"online": true, "presencial": false}',
        },
      ]

      invalidPayloads.forEach(payload => {
        const result = validateStructuredPayload(payload, 'nutritionist')
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('should accept valid array/object payloads', () => {
      const validPayloads = [
        {
          languages: ['Português', 'Inglês'],
          specialties: ['Nutrição Esportiva', 'Emagrecimento'],
          services: ['Consulta Online', 'Plano Alimentar'],
        },
        {
          languages: [],
          specialties: ['Nutrição Clínica'],
          working_hours: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
          },
        },
      ]

      validPayloads.forEach(payload => {
        const result = validateStructuredPayload(payload, 'nutritionist')
        expect(result.isValid).toBe(true)
        expect(result.errors.length).toBe(0)
      })
    })
  })

  describe('Database Storage Contract', () => {
    it('should store arrays as JSON in database', async () => {
      const testData = {
        specialties: ['Nutrição Esportiva', 'Emagrecimento'],
        languages: ['Português', 'Inglês'],
        services: ['Consulta Online', 'Plano Alimentar'],
      }

      // Atualizar o registro de teste
      const { error: updateError } = await supabase
        .from('nutritionist_profiles')
        .update(testData)
        .eq('id', testNutritionistId)

      expect(updateError).toBeNull()

      // Verificar se os dados foram armazenados corretamente
      const { data: storedData, error: fetchError } = await supabase
        .from('nutritionist_profiles')
        .select('specialties, languages, services')
        .eq('id', testNutritionistId)
        .single()

      expect(fetchError).toBeNull()
      expect(Array.isArray(storedData.specialties)).toBe(true)
      expect(Array.isArray(storedData.languages)).toBe(true)
      expect(Array.isArray(storedData.services)).toBe(true)

      expect(storedData.specialties).toEqual(testData.specialties)
      expect(storedData.languages).toEqual(testData.languages)
      expect(storedData.services).toEqual(testData.services)
    })

    it('should not store stringified JSON', async () => {
      // Tentar inserir dados com JSON string (isso deve ser normalizado)
      const corruptedData = {
        specialties: '["Nutrição Esportiva", "Emagrecimento"]',
        languages: '"[\\"Português\\", \\"Inglês\\"]"',
      }

      // Normalizar antes de inserir (simulando middleware)
      const normalizedData = {
        specialties: normalizeSpecialties(corruptedData.specialties),
        languages: normalizeLanguages(corruptedData.languages),
      }

      const { error: updateError } = await supabase
        .from('nutritionist_profiles')
        .update(normalizedData)
        .eq('id', testNutritionistId)

      expect(updateError).toBeNull()

      // Verificar se os dados foram armazenados como arrays, não strings
      const { data: storedData, error: fetchError } = await supabase
        .from('nutritionist_profiles')
        .select('specialties, languages')
        .eq('id', testNutritionistId)
        .single()

      expect(fetchError).toBeNull()
      expect(Array.isArray(storedData.specialties)).toBe(true)
      expect(Array.isArray(storedData.languages)).toBe(true)

      // Verificar que não são strings JSON
      expect(typeof storedData.specialties).not.toBe('string')
      expect(typeof storedData.languages).not.toBe('string')
    })
  })

  describe('End-to-End Data Flow', () => {
    it('should handle complete data flow from form to database', async () => {
      // Simular dados vindos de um formulário
      const formData = {
        languages: 'Português, Inglês, Espanhol',
        specialties: 'Nutrição Esportiva; Emagrecimento; Nutrição Clínica',
        services: '["Consulta Online", "Plano Alimentar", "Acompanhamento"]',
        certifications: '"[\\"CRN-1 12345\\", \\"Pós-graduação\\"]"',
      }

      // Normalizar dados (simulando processamento no front-end/API)
      const normalizedData = {
        languages: normalizeLanguages(formData.languages),
        specialties: normalizeSpecialties(formData.specialties),
        services: normalizeStringArray(formData.services, 'services'),
        certifications: normalizeStringArray(
          formData.certifications,
          'certifications'
        ),
      }

      // Validar payload
      const validation = validateStructuredPayload(
        normalizedData,
        'nutritionist'
      )
      expect(validation.isValid).toBe(true)

      // Salvar no banco
      const { error: updateError } = await supabase
        .from('nutritionist_profiles')
        .update(normalizedData)
        .eq('id', testNutritionistId)

      expect(updateError).toBeNull()

      // Verificar dados salvos
      const { data: savedData, error: fetchError } = await supabase
        .from('nutritionist_profiles')
        .select('languages, specialties, services, certifications')
        .eq('id', testNutritionistId)
        .single()

      expect(fetchError).toBeNull()

      // Verificar que todos os campos são arrays
      expect(Array.isArray(savedData.languages)).toBe(true)
      expect(Array.isArray(savedData.specialties)).toBe(true)
      expect(Array.isArray(savedData.services)).toBe(true)
      expect(Array.isArray(savedData.certifications)).toBe(true)

      // Verificar conteúdo
      expect(savedData.languages).toContain('Português')
      expect(savedData.languages).toContain('Inglês')
      expect(savedData.specialties).toContain('Nutrição Esportiva')
      expect(savedData.services).toContain('Consulta Online')
      expect(savedData.certifications).toContain('CRN-1 12345')
    })
  })

  describe('Safe Serialization', () => {
    it('should serialize data safely without double encoding', () => {
      const testData = {
        languages: ['Português', 'Inglês'],
        specialties: ['Nutrição Esportiva'],
        metadata: { version: 1, updated: new Date().toISOString() },
      }

      const serialized = safeStringify(testData)
      expect(typeof serialized).toBe('string')

      // Verificar que não há escapes duplos
      expect(serialized).not.toMatch(/\\\\/)
      expect(serialized).not.toMatch(/\\"/g)

      // Verificar que pode ser parseado de volta
      const parsed = JSON.parse(serialized)
      expect(parsed).toEqual(testData)
    })

    it('should not double-stringify already stringified data', () => {
      const originalData = ['Português', 'Inglês']
      const firstStringify = JSON.stringify(originalData)

      // safeStringify deve detectar que já é uma string JSON válida
      const safeResult = safeStringify(firstStringify)

      // Deve retornar a string original, não fazer stringify novamente
      expect(safeResult).toBe(firstStringify)

      // Verificar que pode ser parseado corretamente
      const parsed = JSON.parse(safeResult)
      expect(parsed).toEqual(originalData)
    })
  })
})
