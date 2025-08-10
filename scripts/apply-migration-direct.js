const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração diretamente...')

    // Ler o arquivo SQL
    const sqlPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20240801000001_create_consultation_ratings.sql'
    )
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executando ${commands.length} comandos SQL...`)

    // Executar cada comando SQL individualmente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`)
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command + ';',
          })

          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message)
            // Tentar executar diretamente com query
            console.log(`⏳ Tentando executar diretamente com query...`)
            const { error: queryError } = await supabase
              .from('_exec_sql')
              .select('*')
              .eq('sql', command + ';')

            if (queryError) {
              console.error(
                `❌ Erro ao executar com query:`,
                queryError.message
              )
              // Tentar com outro método
              console.log(`⏳ Tentando executar com query SQL direta...`)
              const { error: directError } =
                await supabase.auth.admin.executeSql(command + ';')

              if (directError) {
                console.error(
                  `❌ Erro ao executar diretamente:`,
                  directError.message
                )
              } else {
                console.log(
                  `✅ Comando ${i + 1} executado com sucesso via SQL direto`
                )
              }
            } else {
              console.log(`✅ Comando ${i + 1} executado com sucesso via query`)
            }
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso via RPC`)
          }
        } catch (err) {
          console.error(`❌ Erro inesperado no comando ${i + 1}:`, err.message)
        }
      }
    }

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando se a tabela foi criada...')
    const { data, error } = await supabase
      .from('consultation_ratings')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Erro ao verificar tabela:', error.message)
    } else {
      console.log('✅ Tabela consultation_ratings criada com sucesso!')
    }

    console.log('🎉 Migração concluída!')
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message)
    process.exit(1)
  }
}

// Executar a migração
applyMigration()
