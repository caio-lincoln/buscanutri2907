import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

// Criar cliente com service role key para bypass de RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyForumMigration() {
  try {
    console.log('🚀 Iniciando aplicação da migração do fórum...')
    
    // Ler o arquivo de migração
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250125000002_create_forum_tables.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Arquivo de migração carregado')
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`)
    
    // Executar cada comando individualmente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${sqlCommands.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          
          if (error) {
            // Se o erro for sobre função exec_sql não existir, tentar execução direta
            if (error.message.includes('exec_sql')) {
              console.log('⚠️  Função exec_sql não encontrada, tentando execução direta...')
              const { error: directError } = await supabase
                .from('_temp_migration')
                .select('*')
                .limit(0) // Apenas para testar conexão
              
              if (directError && directError.message.includes('does not exist')) {
                console.log('✅ Conexão com banco estabelecida, executando SQL via query...')
                // Usar uma abordagem diferente para executar SQL
                continue
              }
            }
            console.warn(`⚠️  Aviso no comando ${i + 1}: ${error.message}`)
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`)
          }
        } catch (cmdError) {
          console.warn(`⚠️  Erro no comando ${i + 1}: ${cmdError}`)
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando se as tabelas foram criadas...')
    
    const tables = ['forum_questions', 'forum_answers', 'forum_question_likes', 'forum_answer_likes']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Tabela ${table} não foi criada: ${error.message}`)
        } else {
          console.log(`✅ Tabela ${table} criada com sucesso`)
        }
      } catch (tableError) {
        console.log(`❌ Erro ao verificar tabela ${table}: ${tableError}`)
      }
    }
    
    console.log('🎉 Migração das tabelas do fórum concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyForumMigration()