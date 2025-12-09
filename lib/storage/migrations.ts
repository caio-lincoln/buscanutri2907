import { MigrationStep, StorageAdapter } from './types'

/**
 * Sistema de migrações para o armazenamento
 */

export const migrations: MigrationStep[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: async (storage: StorageAdapter) => {
      void storage
      // Migração inicial - limpar dados legados do localStorage se existirem
      // Remover chaves legadas conhecidas
      const legacyKeys = [
        'admin_session',
        'user_preferences',
        'cache_',
        'auth_',
      ]

      // Verificar se estamos no browser e se localStorage existe
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const allKeys = Object.keys(window.localStorage)
          for (const key of allKeys) {
            // Remover chaves que começam com prefixos legados
            if (legacyKeys.some(prefix => key.startsWith(prefix))) {
              window.localStorage.removeItem(key)
            }
          }
        } catch {}
      }
    },
    rollback: async (storage: StorageAdapter) => {
      void storage
      // Não há rollback para limpeza inicial
    }
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: async (storage: StorageAdapter) => {
      void storage
      // Migrar dados existentes para nova estrutura se necessário
      try {
        // Verificar se há dados de usuário para migrar
        const userData = await storage.get('user_data')
        if (userData) {
          // Reestruturar dados se necessário
          await storage.set('user_profile', userData)
          await storage.remove('user_data')
        }

        // Migrar configurações de cache
        const cacheData = await storage.get('cache_data')
        if (cacheData) {
          await storage.set('app_cache', cacheData)
          await storage.remove('cache_data')
        }
      } catch (error) {
        throw error
      }
    },
    rollback: async (storage: StorageAdapter) => {
      void storage
      try {
        // Reverter mudanças da migração
        const userProfile = await storage.get('user_profile')
        if (userProfile) {
          await storage.set('user_data', userProfile)
          await storage.remove('user_profile')
        }

        const appCache = await storage.get('app_cache')
        if (appCache) {
          await storage.set('cache_data', appCache)
          await storage.remove('app_cache')
        }
      } catch (error) {
        throw error
      }
    }
  }
]

/**
 * Executa migrações de uma versão para outra
 */
export async function runMigrations(
  storage: StorageAdapter,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  
  if (fromVersion === toVersion) {
    return
  }

  if (fromVersion > toVersion) {
    // Rollback
    const rollbackMigrations = migrations
      .filter(m => m.fromVersion < fromVersion && m.toVersion <= fromVersion && m.toVersion > toVersion)
      .sort((a, b) => b.toVersion - a.toVersion) // Ordem decrescente para rollback

    for (const migration of rollbackMigrations) {
      if (migration.rollback) {
        await migration.rollback(storage)
      }
    }
  } else {
    // Migração normal
    const applicableMigrations = migrations
      .filter(m => m.fromVersion >= fromVersion && m.toVersion <= toVersion)
      .sort((a, b) => a.toVersion - b.toVersion) // Ordem crescente

    for (const migration of applicableMigrations) {
      await migration.migrate(storage)
    }
  }
}

/**
 * Verifica se uma migração é necessária
 */
export function isMigrationNeeded(currentVersion: number, targetVersion: number): boolean {
  return currentVersion !== targetVersion
}

/**
 * Obtém a próxima versão de migração disponível
 */
export function getNextMigrationVersion(currentVersion: number): number {
  const nextMigration = migrations
    .filter(m => m.fromVersion >= currentVersion)
    .sort((a, b) => a.toVersion - b.toVersion)[0]
  
  return nextMigration ? nextMigration.toVersion : currentVersion
}
