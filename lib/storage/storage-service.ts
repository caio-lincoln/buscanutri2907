import { 
  StorageService, 
  StorageAdapter, 
  StorageConfig, 
  StorageType, 
  APP_DATA_VERSION, 
  STORAGE_PREFIX, 
  VERSION_KEY 
} from './types'
import { SessionStorageAdapter } from './adapters/session-storage-adapter'
import { IndexedDBAdapter } from './adapters/indexeddb-adapter'
import { MemoryAdapter } from './adapters/memory-adapter'
import { runMigrations, isMigrationNeeded } from './migrations'
import { validateData, containsSensitiveData, removeSensitiveData, schemas } from './validation'

/**
 * Serviço principal de armazenamento com fallback automático e migrações
 */
export class BuscaNutriStorageService implements StorageService {
  private primaryAdapter: StorageAdapter
  private fallbackAdapter: StorageAdapter
  private config: StorageConfig
  private initialized = false

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      appVersion: APP_DATA_VERSION,
      prefix: STORAGE_PREFIX,
      enableValidation: true,
      enableLogging: true,
      fallbackToSession: true,
      ...config
    }

    // Configurar adapters com fallback
    this.primaryAdapter = this.createPrimaryAdapter()
    this.fallbackAdapter = new SessionStorageAdapter(this.config.prefix)
  }

  private createPrimaryAdapter(): StorageAdapter {
    // Tentar IndexedDB primeiro para dados maiores
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        return new IndexedDBAdapter('BuscaNutriDB', 'storage', 1)
      }
    } catch (error) {
      this.log('IndexedDB não disponível, usando SessionStorage', error)
    }

    // Fallback para SessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return new SessionStorageAdapter(this.config.prefix)
      }
    } catch (error) {
      this.log('SessionStorage não disponível, usando MemoryAdapter', error)
    }

    // Último fallback: MemoryAdapter
    return new MemoryAdapter()
  }

  private async getAdapter(): Promise<StorageAdapter> {
    try {
      // Testar se o adapter primário está funcionando
      await this.primaryAdapter.keys()
      return this.primaryAdapter
    } catch (error) {
      this.log('Adapter primário falhou, usando fallback', error)
      
      if (this.config.fallbackToSession) {
        try {
          await this.fallbackAdapter.keys()
          return this.fallbackAdapter
        } catch (fallbackError) {
          this.log('Fallback também falhou, usando MemoryAdapter', fallbackError)
          return new MemoryAdapter()
        }
      }
      
      throw error
    }
  }

  private log(message: string, error?: any): void {
    if (this.config.enableLogging) {
      if (error) {
        console.warn(`[StorageService] ${message}`, error)
      } else {
        console.log(`[StorageService] ${message}`)
      }
    }
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Chave deve ser uma string não vazia')
    }
  }

  private async validateAndSanitizeValue<T>(key: string, value: T): Promise<T> {
    if (this.config.enableValidation) {
      // Verificar dados sensíveis
      if (containsSensitiveData(value)) {
        this.log(`AVISO: Tentativa de armazenar dados sensíveis na chave "${key}"`)
        return removeSensitiveData(value)
      }

      // Aplicar validação específica baseada na chave
      if (key.includes('user_profile') && schemas.userProfile) {
        const validated = validateData(value, schemas.userProfile)
        if (validated === null) {
          throw new Error(`Dados inválidos para user_profile: ${key}`)
        }
        return validated as T
      }

      if (key.includes('preferences') && schemas.appPreferences) {
        const validated = validateData(value, schemas.appPreferences)
        if (validated === null) {
          throw new Error(`Dados inválidos para preferences: ${key}`)
        }
        return validated as T
      }

      if (key.includes('cache') && schemas.cacheEntry) {
        const validated = validateData(value, schemas.cacheEntry)
        if (validated === null) {
          throw new Error(`Dados inválidos para cache: ${key}`)
        }
        return validated as T
      }
    }

    return value
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.log('Inicializando StorageService...')
      
      const adapter = await this.getAdapter()
      const currentVersion = await this.getVersion()
      
      this.log(`Versão atual: ${currentVersion}, Versão alvo: ${this.config.appVersion}`)

      if (isMigrationNeeded(currentVersion, this.config.appVersion)) {
        this.log(`Executando migração: ${currentVersion} -> ${this.config.appVersion}`)
        await runMigrations(adapter, currentVersion, this.config.appVersion)
        await this.setVersion(this.config.appVersion)
        this.log('Migração concluída')
      }

      this.initialized = true
      this.log('StorageService inicializado com sucesso')
    } catch (error) {
      this.log('Erro ao inicializar StorageService', error)
      throw error
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    this.validateKey(key)
    
    try {
      const adapter = await this.getAdapter()
      const value = await adapter.get<T>(key)
      
      if (value === null) {
        return defaultValue ?? null
      }

      // Validar dados lidos se habilitado
      if (this.config.enableValidation) {
        try {
          await this.validateAndSanitizeValue(key, value)
        } catch (validationError) {
          this.log(`Dados inválidos encontrados para chave "${key}", usando valor padrão`, validationError)
          return defaultValue ?? null
        }
      }

      return value
    } catch (error) {
      this.log(`Erro ao ler chave "${key}"`, error)
      return defaultValue ?? null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.validateKey(key)
    
    if (value === undefined) {
      throw new Error('Valor não pode ser undefined. Use null ou remove() para remover.')
    }

    try {
      const sanitizedValue = await this.validateAndSanitizeValue(key, value)
      const adapter = await this.getAdapter()
      await adapter.set(key, sanitizedValue)
    } catch (error) {
      this.log(`Erro ao salvar chave "${key}"`, error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    this.validateKey(key)
    
    try {
      const adapter = await this.getAdapter()
      await adapter.remove(key)
    } catch (error) {
      this.log(`Erro ao remover chave "${key}"`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const adapter = await this.getAdapter()
      await adapter.clear()
      this.log('Storage limpo com sucesso')
    } catch (error) {
      this.log('Erro ao limpar storage', error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    try {
      const adapter = await this.getAdapter()
      return await adapter.keys()
    } catch (error) {
      this.log('Erro ao obter chaves', error)
      return []
    }
  }

  async size(): Promise<number> {
    try {
      const adapter = await this.getAdapter()
      return await adapter.size()
    } catch (error) {
      this.log('Erro ao obter tamanho', error)
      return 0
    }
  }

  async getVersion(): Promise<number> {
    try {
      const adapter = await this.getAdapter()
      const version = await adapter.get<number>(VERSION_KEY)
      return version ?? 0
    } catch (error) {
      this.log('Erro ao obter versão, assumindo versão 0', error)
      return 0
    }
  }

  async setVersion(version: number): Promise<void> {
    try {
      const adapter = await this.getAdapter()
      await adapter.set(VERSION_KEY, version)
    } catch (error) {
      this.log('Erro ao definir versão', error)
      throw error
    }
  }

  async migrate(fromVersion: number, toVersion: number): Promise<void> {
    try {
      const adapter = await this.getAdapter()
      await runMigrations(adapter, fromVersion, toVersion)
      await this.setVersion(toVersion)
    } catch (error) {
      this.log(`Erro durante migração ${fromVersion} -> ${toVersion}`, error)
      throw error
    }
  }

  // Métodos utilitários

  async getStorageType(): Promise<StorageType> {
    const adapter = await this.getAdapter()
    
    if (adapter instanceof IndexedDBAdapter) {
      return 'indexeddb'
    } else if (adapter instanceof SessionStorageAdapter) {
      return 'session'
    } else {
      return 'memory'
    }
  }

  async getStorageInfo(): Promise<{
    type: StorageType
    version: number
    size: number
    keys: string[]
  }> {
    return {
      type: await this.getStorageType(),
      version: await this.getVersion(),
      size: await this.size(),
      keys: await this.keys()
    }
  }

  async cleanup(): Promise<void> {
    this.log('Executando limpeza do storage...')
    
    try {
      const keys = await this.keys()
      const now = Date.now()
      
      for (const key of keys) {
        try {
          // Verificar se é um item de cache expirado
          if (key.includes('cache_')) {
            const item = await this.get(key)
            if (item && typeof item === 'object' && 'timestamp' in item && 'ttl' in item) {
              const { timestamp, ttl } = item as any
              if (ttl && timestamp + ttl < now) {
                await this.remove(key)
                this.log(`Cache expirado removido: ${key}`)
              }
            }
          }
        } catch (error) {
          this.log(`Erro ao verificar item ${key} durante limpeza`, error)
        }
      }
      
      this.log('Limpeza concluída')
    } catch (error) {
      this.log('Erro durante limpeza', error)
    }
  }
}

// Instância singleton
let storageInstance: BuscaNutriStorageService | null = null

export function getStorageService(config?: Partial<StorageConfig>): BuscaNutriStorageService {
  if (!storageInstance) {
    storageInstance = new BuscaNutriStorageService(config)
  }
  return storageInstance
}

// Função para inicializar o storage na aplicação
export async function initializeStorage(config?: Partial<StorageConfig>): Promise<BuscaNutriStorageService> {
  const storage = getStorageService(config)
  await storage.initialize()
  return storage
}
