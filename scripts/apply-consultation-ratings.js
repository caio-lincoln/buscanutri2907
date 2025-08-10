const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://lutokoucdfhfbwtppzwe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env')
  console.log(
    'Variáveis disponíveis:',
    Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyConsultationRatingsMigration() {
  try {
    console.log('🚀 Aplicando migração de avaliações de consultas...')

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-consultation-ratings.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executando ${commands.length} comandos SQL...`)

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: command })

          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message)
            // Continuar com os próximos comandos mesmo se houver erro
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`)
          }
        } catch (err) {
          console.error(`❌ Erro inesperado no comando ${i + 1}:`, err.message)
        }
      }
    }

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando se a tabela foi criada...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'consultation_ratings')

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message)
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabela consultation_ratings criada com sucesso!')
    } else {
      console.log('⚠️ Tabela consultation_ratings não foi encontrada')
    }

    // Verificar estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'consultation_ratings')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError.message)
    } else if (columns && columns.length > 0) {
      console.log('📋 Estrutura da tabela consultation_ratings:')
      columns.forEach(col => {
        console.log(
          `  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`
        )
      })
    }

    console.log('🎉 Migração de avaliações de consultas concluída!')
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message)
    process.exit(1)
  }
}

// Executar a migração
applyConsultationRatingsMigration()
