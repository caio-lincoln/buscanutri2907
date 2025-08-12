import { MigrationStep, StorageAdapter } from './types'

/**
 * Sistema de migrações para o armazenamento
 */

export const migrations: MigrationStep[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: async (storage: StorageAdapter) => {
      // Migração inicial - limpar dados legados do localStorage se existirem
      console.log('Executando migração 0 -> 1: Limpeza inicial')
      
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
              console.log(`Removida chave legada: ${key}`)
            }
          }
        } catch (error) {
          console.warn('Erro ao limpar localStorage legado:', error)
        }
      }
    },
    rollback: async (storage: StorageAdapter) => {
      // Não há rollback para limpeza inicial
      console.log('Rollback 1 -> 0: Nenhuma ação necessária')
    }
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: async (storage: StorageAdapter) => {
      console.log('Executando migração 1 -> 2: Estruturação de dados')
      
      // Migrar dados existentes para nova estrutura se necessário
      try {
        // Verificar se há dados de usuário para migrar
        const userData = await storage.get('user_data')
        if (userData) {
          // Reestruturar dados se necessário
          await storage.set('user_profile', userData)
          await storage.remove('user_data')
          console.log('Dados de usuário migrados para nova estrutura')
        }

        // Migrar configurações de cache
        const cacheData = await storage.get('cache_data')
        if (cacheData) {
          await storage.set('app_cache', cacheData)
          await storage.remove('cache_data')
          console.log('Dados de cache migrados')
        }
      } catch (error) {
        console.warn('Erro durante migração 1 -> 2:', error)
        throw error
      }
    },
    rollback: async (storage: StorageAdapter) => {
      console.log('Executando rollback 2 -> 1: Reverter estruturação')
      
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
        console.warn('Erro durante rollback 2 -> 1:', error)
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
  console.log(`Iniciando migração de versão ${fromVersion} para ${toVersion}`)

  if (fromVersion === toVersion) {
    console.log('Versões iguais, nenhuma migração necessária')
    return
  }

  if (fromVersion > toVersion) {
    // Rollback
    const rollbackMigrations = migrations
      .filter(m => m.fromVersion < fromVersion && m.toVersion <= fromVersion && m.toVersion > toVersion)
      .sort((a, b) => b.toVersion - a.toVersion) // Ordem decrescente para rollback

    for (const migration of rollbackMigrations) {
      if (migration.rollback) {
        console.log(`Executando rollback ${migration.toVersion} -> ${migration.fromVersion}`)
        await migration.rollback(storage)
      }
    }
  } else {
    // Migração normal
    const applicableMigrations = migrations
      .filter(m => m.fromVersion >= fromVersion && m.toVersion <= toVersion)
      .sort((a, b) => a.toVersion - b.toVersion) // Ordem crescente

    for (const migration of applicableMigrations) {
      console.log(`Executando migração ${migration.fromVersion} -> ${migration.toVersion}`)
      await migration.migrate(storage)
    }
  }

  console.log(`Migração concluída: ${fromVersion} -> ${toVersion}`)
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
