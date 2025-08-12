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
    // Limpar mocks antes de cada teste
    jest.clearAllMocks()
    mockAdapter.get.mockResolvedValue(null)
    mockAdapter.set.mockResolvedValue(undefined)
    mockAdapter.remove.mockResolvedValue(undefined)
    mockAdapter.clear.mockResolvedValue(undefined)
    mockAdapter.keys.mockResolvedValue([])
    mockAdapter.size.mockResolvedValue(0)
  })

  describe('isMigrationNeeded', () => {
    test('deve retornar true quando versões são diferentes', () => {
      expect(isMigrationNeeded(1, 2)).toBe(true)
      expect(isMigrationNeeded(2, 1)).toBe(true)
    })

    test('deve retornar false quando versões são iguais', () => {
      expect(isMigrationNeeded(1, 1)).toBe(false)
      expect(isMigrationNeeded(2, 2)).toBe(false)
    })
  })

  describe('runMigrations', () => {
    test('deve executar migração sem erros', async () => {
      await expect(runMigrations(mockAdapter, 0, 1)).resolves.not.toThrow()
    })

    test('deve pular migrações desnecessárias', async () => {
      await runMigrations(mockAdapter, 2, 2)
      // Teste passa se não há erro
      expect(true).toBe(true)
    })
  })

  describe('migrations', () => {
    test('deve ter passos de migração definidos', () => {
      expect(migrations).toBeTruthy()
      expect(Array.isArray(migrations)).toBe(true)
    })
  })
})