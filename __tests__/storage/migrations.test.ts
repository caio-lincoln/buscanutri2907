import { migrations, runMigrations, isMigrationNeeded } from '@/lib/storage/migrations'

// Mock do adapter para testes
const mockAdapter = {
  isAvailable: jest.fn(() => true),
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(() => Promise.resolve([])),
  size: jest.fn(() => Promise.resolve(0))
}

describe('Storage Migrations', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  describe('isMigrationNeeded', () => {
    test('deve retornar true quando versões são diferentes', () => {
      expect(isMigrationNeeded('1.0.0', '1.1.0')).toBe(true)
      expect(isMigrationNeeded('1.0.0', '2.0.0')).toBe(true)
    })

    test('deve retornar false quando versões são iguais', () => {
      expect(isMigrationNeeded('1.0.0', '1.0.0')).toBe(false)
      expect(isMigrationNeeded('2.1.0', '2.1.0')).toBe(false)
    })
  })

  describe('runMigrations', () => {
    test('deve executar migração sem erros', async () => {
      await expect(runMigrations()).resolves.not.toThrow()
    })

    test('deve pular migrações desnecessárias', async () => {
      // Simular que já está na versão atual
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('buscanutri_storage_version', '1.0.0')
      }
      await expect(runMigrations()).resolves.not.toThrow()
    })
  })

  describe('migrations', () => {
    test('deve ter passos de migração definidos', () => {
      expect(migrations).toBeDefined()
      expect(Array.isArray(migrations)).toBe(true)
    })
  })
})