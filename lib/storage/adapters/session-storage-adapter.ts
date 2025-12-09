import { StorageAdapter, StorageError } from '../types'

/**
 * Adapter para SessionStorage - dados voláteis que expiram ao fechar o navegador
 */
export class SessionStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix: string = '') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return this.prefix + key
  }

  isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 
             window.sessionStorage !== undefined &&
             window.sessionStorage !== null
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

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      throw this.createError('STORAGE_UNAVAILABLE', 'SessionStorage não está disponível')
    }

    try {
      const item = window.sessionStorage.getItem(this.getKey(key))
      if (item === null) {
        return null
      }
      return JSON.parse(item) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isAvailable()) {
      throw this.createError('STORAGE_UNAVAILABLE', 'SessionStorage não está disponível')
    }

    try {
      const serialized = JSON.stringify(value)
      window.sessionStorage.setItem(this.getKey(key), serialized)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw this.createError('QUOTA_EXCEEDED', 'Cota do sessionStorage excedida', error)
      }
      throw this.createError('STORAGE_UNAVAILABLE', `Erro ao salvar no sessionStorage: ${error}`, error as Error)
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw this.createError('STORAGE_UNAVAILABLE', 'SessionStorage não está disponível')
    }

    try {
      window.sessionStorage.removeItem(this.getKey(key))
    } catch {}
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw this.createError('STORAGE_UNAVAILABLE', 'SessionStorage não está disponível')
    }

    try {
      // Remove apenas as chaves com nosso prefixo
      const keys = await this.keys()
      for (const key of keys) {
        await this.remove(key.replace(this.prefix, ''))
      }
    } catch {}
  }

  async keys(): Promise<string[]> {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const allKeys = Object.keys(window.sessionStorage)
      return allKeys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''))
    } catch {
      return []
    }
  }

  async size(): Promise<number> {
    const keys = await this.keys()
    return keys.length
  }
}
