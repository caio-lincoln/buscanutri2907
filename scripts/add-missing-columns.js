// Script para adicionar as colunas faltantes na tabela nutritionist_profiles
// Este script resolve permanentemente os erros PGRST204

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias'
  )
  process.exit(1)
}

// Criar cliente com service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  console.log(
    '🔧 Iniciando adição de colunas faltantes na tabela nutritionist_profiles...\n'
  )

  const columnsToAdd = [
    {
      name: 'cancellation_policy',
      type: 'TEXT',
      description: 'Política de cancelamento do nutricionista',
    },
    {
      name: 'default_consultation_duration',
      type: 'INTEGER',
      description: 'Duração padrão das consultas em minutos',
    },
    {
      name: 'identity_document_url',
      type: 'TEXT',
      description: 'URL do documento de identidade',
    },
  ]

  for (const column of columnsToAdd) {
    try {
      console.log(`📝 Adicionando coluna: ${column.name} (${column.type})`)

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`,
      })

      if (error) {
        console.error(
          `❌ Erro ao adicionar coluna ${column.name}:`,
          error.message
        )

        // Se a função exec_sql não existir, tentar abordagem alternativa
        if (error.message.includes('exec_sql')) {
          console.log(
            `⚠️ Função exec_sql não encontrada. Tentando abordagem alternativa...`
          )

          // Verificar se a coluna já existe consultando a estrutura da tabela
          const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'nutritionist_profiles')
            .eq('column_name', column.name)

          if (columnsError) {
            console.error(
              `❌ Erro ao verificar coluna ${column.name}:`,
              columnsError.message
            )
          } else if (columns && columns.length > 0) {
            console.log(`✅ Coluna ${column.name} já existe`)
          } else {
            console.log(
              `❌ Coluna ${column.name} não existe e não pode ser criada automaticamente`
            )
            console.log(
              `   Execute manualmente: ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
            )
          }
        }
      } else {
        console.log(`✅ Coluna ${column.name} adicionada com sucesso`)
      }
    } catch (err) {
      console.error(
        `❌ Erro inesperado ao adicionar coluna ${column.name}:`,
        err.message
      )
    }
  }

  console.log('\n🔍 Verificando estrutura atual da tabela...')

  try {
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'nutritionist_profiles')
      .order('ordinal_position')

    if (tableError) {
      console.error(
        '❌ Erro ao consultar estrutura da tabela:',
        tableError.message
      )
    } else {
      console.log('\n📋 Estrutura atual da tabela nutritionist_profiles:')
      tableInfo.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        console.log(`   - ${col.column_name}: ${col.data_type} (${nullable})`)
      })
    }
  } catch (err) {
    console.error('❌ Erro ao verificar estrutura da tabela:', err.message)
  }

  console.log('\n✅ Script concluído!')
  console.log('\n📝 Próximos passos:')
  console.log(
    '1. Se as colunas foram adicionadas com sucesso, remova a solução temporária do profile-service.ts'
  )
  console.log(
    '2. Se houve erro, execute os comandos SQL manualmente no dashboard do Supabase'
  )
  console.log(
    '3. Teste a atualização de perfil de nutricionista para confirmar que funciona'
  )
}

// Executar o script
addMissingColumns().catch(console.error)
