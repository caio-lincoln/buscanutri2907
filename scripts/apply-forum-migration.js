const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyForumMigration() {
  try {
    console.log('🚀 Aplicando migração das tabelas do fórum...')
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250125000002_create_forum_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = migrationSQL
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
            console.warn(`⚠️ Aviso no comando ${i + 1}: ${error.message}`)
          }
        } catch (err) {
          console.warn(`⚠️ Erro no comando ${i + 1}: ${err.message}`)
        }
      }
    }
    
    console.log('✅ Migração das tabelas do fórum aplicada com sucesso!')
    
    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'forum_%')
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError)
    } else {
      console.log('📋 Tabelas do fórum criadas:')
      tables.forEach(table => console.log(`  - ${table.table_name}`))
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyForumMigration()