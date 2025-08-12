import { StorageAdapter } from '../types'

/**
 * Adapter de memória - fallback quando outros storages não estão disponíveis
 * Dados são perdidos ao recarregar a página
 */
export class MemoryAdapter implements StorageAdapter {
  private storage: Map<string, any> = new Map()

  isAvailable(): boolean {
    return true // Memory adapter is always available
  }

  async get<T>(key: string): Promise<T | null> {
    return this.storage.get(key) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storage.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys())
  }

  async size(): Promise<number> {
    return this.storage.size
  }
}
