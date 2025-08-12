import { SessionStorageAdapter } from '@/lib/storage/adapters/session-storage-adapter'
import { MemoryAdapter } from '@/lib/storage/adapters/memory-adapter'
import { IndexedDBAdapter } from '@/lib/storage/adapters/indexeddb-adapter'

// Mock do sessionStorage para testes
class MockSessionStorage {
  private store: Record<string, string> = {}

  getItem = jest.fn((key: string) => this.store[key] || null)
  
  setItem = jest.fn((key: string, value: string) => {
    this.store[key] = value
    // Adicionar como propriedade enumerável para Object.keys funcionar
    Object.defineProperty(this, key, {
      value: value,
      enumerable: true,
      configurable: true
    })
  })
  
  removeItem = jest.fn((key: string) => {
    delete this.store[key]
    delete (this as any)[key]
  })
  
  clear = jest.fn(() => {
    Object.keys(this.store).forEach(key => {
      delete this.store[key]
      delete (this as any)[key]
    })
  })
  
  get length() {
    return Object.keys(this.store).length
  }
  
  key = jest.fn((index: number) => Object.keys(this.store)[index] || null)
}

const mockSessionStorage = new MockSessionStorage()

// Mock do IndexedDB para testes
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
}

// Setup dos mocks globais
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
})

describe('Storage Adapters', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks()
    mockSessionStorage.clear()
  })

  describe('SessionStorageAdapter', () => {
    let adapter: SessionStorageAdapter

    beforeEach(() => {
      adapter = new SessionStorageAdapter('buscanutri_')
    })

    test('deve verificar disponibilidade corretamente', () => {
      expect(adapter.isAvailable()).toBe(true)
    })

    test('deve armazenar e recuperar dados', async () => {
      const testData = { name: 'test', value: 123 }

      await adapter.set('test-key', testData)
      const retrieved = await adapter.get('test-key')

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'buscanutri_test-key',
        JSON.stringify(testData)
      )
      expect(retrieved).toEqual(testData)
    })

    test('deve retornar null para chave inexistente', async () => {
      const result = await adapter.get('non-existent-key')
      expect(result).toBe(null)
    })

    test('deve remover dados', async () => {
      await adapter.set('test-key', 'test-value')
      await adapter.remove('test-key')

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('buscanutri_test-key')

      const result = await adapter.get('test-key')
      expect(result).toBe(null)
    })

    test('deve limpar todos os dados', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      await adapter.clear()

      expect(mockSessionStorage.clear).toHaveBeenCalled()
    })

    test('deve retornar todas as chaves', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      const keys = await adapter.keys()
      expect(keys).toEqual(['key1', 'key2'])
    })

    test('deve retornar o tamanho correto', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      const size = await adapter.size()
      expect(size).toBe(2)
    })

    test('deve tratar erros de JSON parsing', async () => {
      // Simular dados corrompidos no sessionStorage
      mockSessionStorage.store['buscanutri_corrupted'] = 'invalid-json{'

      const result = await adapter.get('corrupted')
      expect(result).toBe(null)
    })
  })

  describe('MemoryAdapter', () => {
    let adapter: MemoryAdapter

    beforeEach(() => {
      adapter = new MemoryAdapter()
    })

    test('deve estar sempre disponível', () => {
      expect(adapter.isAvailable()).toBe(true)
    })

    test('deve armazenar e recuperar dados em memória', async () => {
      const testData = { name: 'test', value: 123 }

      await adapter.set('test-key', testData)
      const retrieved = await adapter.get('test-key')

      expect(retrieved).toEqual(testData)
    })

    test('deve retornar null para chave inexistente', async () => {
      const result = await adapter.get('non-existent-key')
      expect(result).toBe(null)
    })

    test('deve remover dados', async () => {
      await adapter.set('test-key', 'test-value')
      await adapter.remove('test-key')

      const result = await adapter.get('test-key')
      expect(result).toBe(null)
    })

    test('deve limpar todos os dados', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      await adapter.clear()

      const keys = await adapter.keys()
      expect(keys).toEqual([])
    })

    test('deve retornar todas as chaves', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      const keys = await adapter.keys()
      expect(keys.sort()).toEqual(['key1', 'key2'])
    })

    test('deve retornar o tamanho correto', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      const size = await adapter.size()
      expect(size).toBe(2)
    })

    test('deve isolar dados entre instâncias', async () => {
      const adapter1 = new MemoryAdapter()
      const adapter2 = new MemoryAdapter()

      await adapter1.set('key', 'value1')
      await adapter2.set('key', 'value2')

      const value1 = await adapter1.get('key')
      const value2 = await adapter2.get('key')

      expect(value1).toBe('value1')
      expect(value2).toBe('value2')
    })
  })

  describe('IndexedDBAdapter', () => {
    let adapter: IndexedDBAdapter

    beforeEach(() => {
      adapter = new IndexedDBAdapter('buscanutri_test')
    })

    test('deve verificar disponibilidade do IndexedDB', () => {
      expect(adapter.isAvailable()).toBe(true)
    })
  })
})