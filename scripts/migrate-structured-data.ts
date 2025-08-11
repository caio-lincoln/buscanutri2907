/**
 * Script de migração para normalizar dados estruturados existentes
 * Executa normalização em lote com backup de segurança
 */

import { createClient } from '@supabase/supabase-js'
import {
  normalizeStringArray,
  normalizeLanguages,
  normalizeSpecialties,
  createBackup,
  logNormalizationEvent,
  type NormalizationResult,
} from '../lib/structured-data-utils'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configurações da migração
const BATCH_SIZE = 50
const DRY_RUN = process.env.DRY_RUN === 'true'

interface MigrationStats {
  totalRecords: number
  processedRecords: number
  corruptedRecords: number
  errors: number
  fieldsNormalized: number
}

interface FieldMigration {
  table: string
  field: string
  normalizer: (value: unknown) => NormalizationResult<string[]>
  backupField: string
}

// Definição dos campos a serem migrados
const FIELD_MIGRATIONS: FieldMigration[] = [
  {
    table: 'nutritionist_profiles',
    field: 'languages',
    normalizer: normalizeLanguages,
    backupField: 'languages_raw_backup',
  },
  {
    table: 'nutritionist_profiles',
    field: 'specialties',
    normalizer: normalizeSpecialties,
    backupField: 'specialties_raw_backup',
  },
  {
    table: 'nutritionist_profiles',
    field: 'certifications',
    normalizer: normalizeStringArray,
    backupField: 'certifications_raw_backup',
  },
  {
    table: 'nutritionist_profiles',
    field: 'achievements',
    normalizer: normalizeStringArray,
    backupField: 'achievements_raw_backup',
  },
  {
    table: 'nutritionist_profiles',
    field: 'available_times',
    normalizer: normalizeStringArray,
    backupField: 'available_times_raw_backup',
  },
  {
    table: 'patient_profiles',
    field: 'dietary_preferences',
    normalizer: normalizeStringArray,
    backupField: 'dietary_preferences_raw_backup',
  },
]

/**
 * Executa migração para uma tabela específica
 */
async function migrateTable(
  migration: FieldMigration
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalRecords: 0,
    processedRecords: 0,
    corruptedRecords: 0,
    errors: 0,
    fieldsNormalized: 0,
  }

  console.log(`\n🔄 Migrando ${migration.table}.${migration.field}...`)

  try {
    // Buscar total de registros
    const { count } = await supabase
      .from(migration.table)
      .select('*', { count: 'exact', head: true })

    stats.totalRecords = count || 0
    console.log(`📊 Total de registros: ${stats.totalRecords}`)

    if (stats.totalRecords === 0) {
      console.log('✅ Nenhum registro encontrado')
      return stats
    }

    // Processar em lotes
    let offset = 0
    while (offset < stats.totalRecords) {
      const { data: records, error } = await supabase
        .from(migration.table)
        .select(`id, ${migration.field}`)
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) {
        console.error(`❌ Erro ao buscar registros: ${error.message}`)
        stats.errors++
        break
      }

      if (!records || records.length === 0) {
        break
      }

      // Processar cada registro do lote
      for (const record of records) {
        try {
          const fieldValue = record[migration.field]

          // Pular se o campo já é null/undefined
          if (fieldValue === null || fieldValue === undefined) {
            stats.processedRecords++
            continue
          }

          // Normalizar o campo
          const result = migration.normalizer(fieldValue)

          // Log se dados foram corrompidos
          if (result.wasCorrupted) {
            stats.corruptedRecords++
            logNormalizationEvent(migration.field, result, {
              context: 'migration',
              table: migration.table,
              recordId: record.id,
            })
          }

          // Verificar se houve mudança
          const hasChanged =
            JSON.stringify(result.data) !== JSON.stringify(fieldValue)

          if (hasChanged || result.wasCorrupted) {
            if (!DRY_RUN) {
              // Criar backup do valor original
              const backup = createBackup(fieldValue, migration.field)

              // Atualizar registro com valor normalizado e backup
              const { error: updateError } = await supabase
                .from(migration.table)
                .update({
                  [migration.field]: result.data,
                  [migration.backupField]: backup.backupValue,
                })
                .eq('id', record.id)

              if (updateError) {
                console.error(
                  `❌ Erro ao atualizar registro ${record.id}: ${updateError.message}`
                )
                stats.errors++
                continue
              }
            }

            stats.fieldsNormalized++

            if (DRY_RUN) {
              console.log(
                `🔍 [DRY RUN] Registro ${record.id}: ${JSON.stringify(fieldValue)} → ${JSON.stringify(result.data)}`
              )
            }
          }

          stats.processedRecords++
        } catch (recordError) {
          console.error(
            `❌ Erro ao processar registro ${record.id}:`,
            recordError
          )
          stats.errors++
        }
      }

      offset += BATCH_SIZE
      console.log(
        `📈 Progresso: ${Math.min(offset, stats.totalRecords)}/${stats.totalRecords} (${Math.round((Math.min(offset, stats.totalRecords) / stats.totalRecords) * 100)}%)`
      )
    }

    console.log(
      `✅ Migração de ${migration.table}.${migration.field} concluída`
    )
    console.log(`   📊 Processados: ${stats.processedRecords}`)
    console.log(`   🔧 Normalizados: ${stats.fieldsNormalized}`)
    console.log(`   ⚠️  Corrompidos: ${stats.corruptedRecords}`)
    console.log(`   ❌ Erros: ${stats.errors}`)
  } catch (error) {
    console.error(
      `❌ Erro na migração de ${migration.table}.${migration.field}:`,
      error
    )
    stats.errors++
  }

  return stats
}

/**
 * Executa todas as migrações
 */
async function runMigrations() {
  console.log('🚀 Iniciando migração de dados estruturados...')

  if (DRY_RUN) {
    console.log('🔍 MODO DRY RUN - Nenhuma alteração será feita no banco')
  }

  const totalStats: MigrationStats = {
    totalRecords: 0,
    processedRecords: 0,
    corruptedRecords: 0,
    errors: 0,
    fieldsNormalized: 0,
  }

  for (const migration of FIELD_MIGRATIONS) {
    const stats = await migrateTable(migration)

    totalStats.totalRecords += stats.totalRecords
    totalStats.processedRecords += stats.processedRecords
    totalStats.corruptedRecords += stats.corruptedRecords
    totalStats.errors += stats.errors
    totalStats.fieldsNormalized += stats.fieldsNormalized
  }

  console.log('\n🎉 Migração concluída!')
  console.log('📊 Estatísticas finais:')
  console.log(`   📋 Total de registros: ${totalStats.totalRecords}`)
  console.log(`   ✅ Processados: ${totalStats.processedRecords}`)
  console.log(`   🔧 Normalizados: ${totalStats.fieldsNormalized}`)
  console.log(`   ⚠️  Corrompidos detectados: ${totalStats.corruptedRecords}`)
  console.log(`   ❌ Erros: ${totalStats.errors}`)

  if (totalStats.corruptedRecords > 0) {
    console.log('\n⚠️  Dados corrompidos foram detectados e normalizados.')
    console.log('   Verifique os logs para mais detalhes.')
  }

  if (totalStats.errors > 0) {
    console.log('\n❌ Alguns erros ocorreram durante a migração.')
    console.log('   Verifique os logs e execute novamente se necessário.')
    process.exit(1)
  }

  console.log('\n✨ Migração executada com sucesso!')
}

/**
 * Função para verificar dados corrompidos sem migrar
 */
async function scanCorruptedData() {
  console.log('🔍 Escaneando dados corrompidos...')

  for (const migration of FIELD_MIGRATIONS) {
    console.log(`\n📋 Verificando ${migration.table}.${migration.field}...`)

    const { data: records, error } = await supabase
      .from(migration.table)
      .select(`id, ${migration.field}`)

    if (error) {
      console.error(`❌ Erro ao buscar dados: ${error.message}`)
      continue
    }

    if (!records || records.length === 0) {
      console.log('✅ Nenhum registro encontrado')
      continue
    }

    let corruptedCount = 0
    for (const record of records) {
      const result = migration.normalizer(record[migration.field])
      if (result.wasCorrupted) {
        corruptedCount++
        console.log(`⚠️  Registro ${record.id}: dados corrompidos detectados`)
      }
    }

    console.log(`📊 Total: ${records.length}, Corrompidos: ${corruptedCount}`)
  }
}

// Executar script
if (require.main === module) {
  const command = process.argv[2]

  if (command === 'scan') {
    scanCorruptedData().catch(console.error)
  } else {
    runMigrations().catch(console.error)
  }
}

export { runMigrations, scanCorruptedData }
