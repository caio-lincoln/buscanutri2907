import { BuscaNutriStorageService } from '../../lib/storage/storage-service'

// Mock dos adapters
jest.mock('../../lib/storage/adapters/indexeddb-adapter')
jest.mock('../../lib/storage/adapters/session-storage-adapter')
jest.mock('../../lib/storage/adapters/memory-adapter')

describe('BuscaNutriStorageService', () => {
  let service: BuscaNutriStorageService
  let mockPrimaryAdapter: any
  let mockSecondaryAdapter: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock do adapter primário
    mockPrimaryAdapter = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
      size: jest.fn().mockResolvedValue(0),
      getVersion: jest.fn().mockResolvedValue(0),
      setVersion: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }
    
    // Mock do adapter secundário
    mockSecondaryAdapter = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
      size: jest.fn().mockResolvedValue(0),
      getVersion: jest.fn().mockResolvedValue(0),
      setVersion: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }

    service = new BuscaNutriStorageService({
      enableValidation: false,
      enableLogging: false
    })
    // Injetar os mocks
    ;(service as any).primaryAdapter = mockPrimaryAdapter
    ;(service as any).secondaryAdapter = mockSecondaryAdapter
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Inicialização', () => {
    test('deve inicializar sem erros', async () => {
      await expect(service.initialize()).resolves.not.toThrow()
    })

    test('deve permitir múltiplas inicializações', async () => {
      await service.initialize()
      await expect(service.initialize()).resolves.not.toThrow()
    })
  })

  describe('Operações básicas', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('deve armazenar e recuperar dados', async () => {
      const testData = { name: 'test', value: 123 }

      mockPrimaryAdapter.get.mockResolvedValue(null)
      mockPrimaryAdapter.set.mockResolvedValue(undefined)
      mockPrimaryAdapter.get.mockResolvedValueOnce(testData)

      await service.set('test-key', testData)
      const result = await service.get('test-key')

      expect(mockPrimaryAdapter.set).toHaveBeenCalledWith('test-key', testData)
      expect(result).toEqual(testData)
    })

    test('deve retornar valor padrão quando chave não existe', async () => {
      const result = await service.get('non-existent', 'default-value')
      expect(result).toBe('default-value')
    })

    test('deve retornar null quando chave não existe e não há valor padrão', async () => {
      const result = await service.get('non-existent')
      expect(result).toBe(null)
    })

    test('deve remover dados', async () => {
      await service.set('test-key', 'test-value')
      await service.remove('test-key')

      const result = await service.get('test-key')
      expect(result).toBe(null)
    })

    test('deve limpar todos os dados', async () => {
      await service.set('key1', 'value1')
      await service.set('key2', 'value2')

      await service.clear()

      const result1 = await service.get('key1')
      const result2 = await service.get('key2')

      expect(result1).toBe(null)
      expect(result2).toBe(null)
    })

    test('deve retornar chaves armazenadas', async () => {
      // Mock do adapter para retornar chaves
      mockPrimaryAdapter.keys.mockResolvedValue(['key1', 'key2'])

      await service.set('key1', 'value1')
      await service.set('key2', 'value2')

      const keys = await service.keys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })

    test('deve retornar tamanho do storage', async () => {
      // Mock do adapter para retornar tamanho
      mockPrimaryAdapter.size.mockResolvedValue(2)

      await service.set('key1', 'value1')

      const size = await service.size()

      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Validação de chaves', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('deve rejeitar chaves vazias', async () => {
      await expect(service.set('', 'value')).rejects.toThrow('Chave deve ser uma string não vazia')
      await expect(service.get('')).rejects.toThrow('Chave deve ser uma string não vazia')
      await expect(service.remove('')).rejects.toThrow('Chave deve ser uma string não vazia')
    })

    test('deve rejeitar chaves null/undefined', async () => {
      await expect(service.set(null as any, 'value')).rejects.toThrow('Chave deve ser uma string não vazia')
      await expect(service.set(undefined as any, 'value')).rejects.toThrow('Chave deve ser uma string não vazia')
    })
  })

  describe('Validação de valores', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('deve rejeitar valores undefined', async () => {
      await expect(service.set('key', undefined)).rejects.toThrow('Valor não pode ser undefined')
    })

    test('deve permitir valores null', async () => {
      await expect(service.set('key', null)).resolves.not.toThrow()
    })

    test('deve permitir valores primitivos', async () => {
      await expect(service.set('string', 'test')).resolves.not.toThrow()
      await expect(service.set('number', 123)).resolves.not.toThrow()
      await expect(service.set('boolean', true)).resolves.not.toThrow()
    })

    test('deve permitir objetos', async () => {
      const obj = { name: 'test', value: 123 }
      await expect(service.set('object', obj)).resolves.not.toThrow()
    })

    test('deve permitir arrays', async () => {
      const arr = [1, 2, 3, 'test']
      await expect(service.set('array', arr)).resolves.not.toThrow()
    })
  })

  describe('Informações do storage', () => {
    test('deve retornar informações do storage', async () => {
      await service.initialize()

      // Mock dos adapters para retornar informações
      mockPrimaryAdapter.keys.mockResolvedValue(['key1', 'key2'])
      mockPrimaryAdapter.size.mockResolvedValue(2)

      const info = await service.getStorageInfo()

      expect(info).toHaveProperty('type')
      expect(info).toHaveProperty('version')
      expect(info).toHaveProperty('size')
      expect(info).toHaveProperty('keys')

      expect(typeof info.size).toBe('number')
      expect(typeof info.version).toBe('number')
    })

    test('deve retornar tipo de storage válido', async () => {
      await service.initialize()

      const { type } = await service.getStorageInfo()

      expect(['indexeddb', 'session', 'memory']).toContain(type)
    })
  })

  describe('Versioning', () => {
    test('deve gerenciar versões', async () => {
      await service.initialize()

      const initialVersion = await service.getVersion()
      expect(typeof initialVersion).toBe('number')

      await service.setVersion(2)

      const version = await service.getVersion()
      expect(typeof version).toBe('number')
    })
  })

  describe('Limpeza', () => {
    test('deve executar limpeza sem erros', async () => {
      await service.initialize()
      await expect(service.cleanup()).resolves.not.toThrow()
    })
  })
})