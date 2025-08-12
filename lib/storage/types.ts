/**
 * Tipos e interfaces para o sistema de armazenamento
 */

export interface StorageAdapter {
  isAvailable(): boolean
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  size(): Promise<number>
}

export interface StorageService {
  get<T>(key: string, defaultValue?: T): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  size(): Promise<number>
  migrate(fromVersion: number, toVersion: number): Promise<void>
  getVersion(): Promise<number>
  setVersion(version: number): Promise<void>
}

export interface MigrationStep {
  fromVersion: number
  toVersion: number
  migrate: (storage: StorageAdapter) => Promise<void>
  rollback?: (storage: StorageAdapter) => Promise<void>
}

export interface StorageConfig {
  appVersion: number
  prefix: string
  enableValidation: boolean
  enableLogging: boolean
  fallbackToSession: boolean
}

export interface ValidationSchema<T = any> {
  validate: (data: unknown) => T | null
  sanitize?: (data: T) => T
}

export type StorageType = 'session' | 'indexeddb' | 'memory'

export interface StorageError extends Error {
  code: 'STORAGE_UNAVAILABLE' | 'VALIDATION_FAILED' | 'MIGRATION_FAILED' | 'QUOTA_EXCEEDED'
  originalError?: Error
}

// Constantes
export const APP_DATA_VERSION = 2
export const STORAGE_PREFIX = 'buscanutri_'
export const VERSION_KEY = `${STORAGE_PREFIX}version`