import { StorageAdapter, StorageError } from '../types'

/**
 * Adapter para IndexedDB - para dados >10KB, listas, cache, offline
 */
export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string
  private storeName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName: string = 'BuscaNutriDB', storeName: string = 'storage', version: number = 1) {
    this.dbName = dbName
    this.storeName = storeName
    this.version = version
  }

  isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 
             'indexedDB' in window && 
             window.indexedDB !== null
    } catch {
      return false
    }
  }

  private createError(code: StorageError['code'], message: string, originalError?: Error): StorageError {
    const error = new Error(message) as StorageError
    error.code = code
    error.originalError = originalError
    return error
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (!this.isAvailable()) {
      throw this.createError('STORAGE_UNAVAILABLE', 'IndexedDB não está disponível')
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(this.createError('STORAGE_UNAVAILABLE', 'Erro ao abrir IndexedDB', request.error as Error))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], mode)
    return transaction.objectStore(this.storeName)
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const store = await this.getTransaction('readonly')
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        
        request.onerror = () => {
          reject(this.createError('STORAGE_UNAVAILABLE', `Erro ao ler IndexedDB para a chave "${key}"`, request.error as Error))
        }
        
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.value : null)
        }
      })
    } catch (error) {
      console.warn(`Erro ao ler IndexedDB para a chave "${key}":`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite')
      
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value })
        
        request.onerror = () => {
          if (request.error?.name === 'QuotaExceededError') {
            reject(this.createError('QUOTA_EXCEEDED', 'Cota do IndexedDB excedida', request.error as Error))
          } else {
            reject(this.createError('STORAGE_UNAVAILABLE', `Erro ao salvar no IndexedDB: ${request.error}`, request.error as Error))
          }
        }
        
        request.onsuccess = () => {
          resolve()
        }
      })
    } catch (error) {
      throw this.createError('STORAGE_UNAVAILABLE', `Erro ao salvar no IndexedDB: ${error}`, error as Error)
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite')
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        
        request.onerror = () => {
          reject(this.createError('STORAGE_UNAVAILABLE', `Erro ao remover chave ${key} do IndexedDB`, request.error as Error))
        }
        
        request.onsuccess = () => {
          resolve()
        }
      })
    } catch (error) {
      console.warn(`Erro ao remover chave ${key} do IndexedDB:`, error)
    }
  }

  async clear(): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite')
      
      return new Promise((resolve, reject) => {
        const request = store.clear()
        
        request.onerror = () => {
          reject(this.createError('STORAGE_UNAVAILABLE', 'Erro ao limpar IndexedDB', request.error as Error))
        }
        
        request.onsuccess = () => {
          resolve()
        }
      })
    } catch (error) {
      console.warn('Erro ao limpar IndexedDB:', error)
    }
  }

  async keys(): Promise<string[]> {
    try {
      const store = await this.getTransaction('readonly')
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys()
        
        request.onerror = () => {
          reject(this.createError('STORAGE_UNAVAILABLE', 'Erro ao obter chaves do IndexedDB', request.error as Error))
        }
        
        request.onsuccess = () => {
          resolve(request.result as string[])
        }
      })
    } catch (error) {
      console.warn('Erro ao obter chaves do IndexedDB:', error)
      return []
    }
  }

  async size(): Promise<number> {
    try {
      const store = await this.getTransaction('readonly')
      
      return new Promise((resolve, reject) => {
        const request = store.count()
        
        request.onerror = () => {
          reject(this.createError('STORAGE_UNAVAILABLE', 'Erro ao contar itens do IndexedDB', request.error as Error))
        }
        
        request.onsuccess = () => {
          resolve(request.result)
        }
      })
    } catch (error) {
      console.warn('Erro ao contar itens do IndexedDB:', error)
      return 0
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}