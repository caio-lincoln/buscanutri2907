/**
 * Sistema de armazenamento BuscaNutri
 * 
 * Substitui o uso direto de localStorage por um sistema robusto com:
 * - Fallback automático (IndexedDB -> SessionStorage -> Memory)
 * - Sistema de migrações
 * - Validação de dados
 * - Segurança (proibição de dados sensíveis)
 * - Tratamento de erros
 */

// Tipos e interfaces
export type {
  StorageAdapter,
  StorageService,
  StorageConfig,
  StorageType,
  StorageError,
  MigrationStep,
  ValidationSchema
} from './types'

// Constantes
export {
  APP_DATA_VERSION,
  STORAGE_PREFIX,
  VERSION_KEY
} from './types'

// Adapters
export { SessionStorageAdapter } from './adapters/session-storage-adapter'
export { IndexedDBAdapter } from './adapters/indexeddb-adapter'
export { MemoryAdapter } from './adapters/memory-adapter'

// Serviço principal
export { 
  BuscaNutriStorageService,
  getStorageService,
  initializeStorage
} from './storage-service'

// Sistema de migrações
export {
  migrations,
  runMigrations,
  isMigrationNeeded,
  getNextMigrationVersion
} from './migrations'

// Sistema de validação
export {
  validators,
  schemas,
  validateData,
  containsSensitiveData,
  removeSensitiveData
} from './validation'

// Instância padrão para uso direto
import { getStorageService } from './storage-service'

/**
 * Instância padrão do storage service
 * Use esta instância para operações simples
 */
export const storage = getStorageService()

/**
 * Hook para usar o storage em componentes React
 * Garante que o storage seja inicializado antes do uso
 */
export function useStorage() {
  const storageService = getStorageService()
  
  // Inicializar se ainda não foi inicializado
  if (typeof window !== 'undefined') {
    storageService.initialize().catch(error => {
      console.warn('Erro ao inicializar storage:', error)
    })
  }
  
  return storageService
}

/**
 * Utilitários para migração de localStorage existente
 */
export const migrationUtils = {
  /**
   * Migra dados do localStorage para o novo sistema
   */
  async migrateFromLocalStorage(keyMappings: Record<string, string> = {}) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const storageService = getStorageService()
    await storageService.initialize()

    try {
      const localStorageKeys = Object.keys(window.localStorage)
      
      for (const oldKey of localStorageKeys) {
        try {
          const value = window.localStorage.getItem(oldKey)
          if (value) {
            const newKey = keyMappings[oldKey] || oldKey
            const parsedValue = JSON.parse(value)
            
            await storageService.set(newKey, parsedValue)
            console.log(`Migrado: ${oldKey} -> ${newKey}`)
          }
        } catch (error) {
          console.warn(`Erro ao migrar chave ${oldKey}:`, error)
        }
      }
    } catch (error) {
      console.warn('Erro durante migração do localStorage:', error)
    }
  },

  /**
   * Remove todas as chaves do localStorage após migração
   */
  async clearLegacyLocalStorage(keysToKeep: string[] = []) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    try {
      const allKeys = Object.keys(window.localStorage)
      
      for (const key of allKeys) {
        if (!keysToKeep.includes(key)) {
          window.localStorage.removeItem(key)
          console.log(`Removida chave legada: ${key}`)
        }
      }
    } catch (error) {
      console.warn('Erro ao limpar localStorage legado:', error)
    }
  }
}