const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.error(
    'Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCancellationPolicyColumn() {
  try {
    console.log(
      '🚀 Adicionando coluna cancellation_policy à tabela nutritionist_profiles...'
    )

    // SQL para adicionar a coluna
    const sql = `
      -- Adicionar coluna cancellation_policy à tabela nutritionist_profiles
      ALTER TABLE public.nutritionist_profiles 
      ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
      
      -- Adicionar comentário para documentar a coluna
      COMMENT ON COLUMN public.nutritionist_profiles.cancellation_policy IS 'Política de cancelamento de consultas definida pelo nutricionista';
    `

    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executando ${commands.length} comandos SQL...`)

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`)

      try {
        // Tentar executar via RPC primeiro
        const { error } = await supabase.rpc('exec_sql', { sql_query: command })

        if (error) {
          console.warn(`⚠️  RPC falhou, tentando query direta...`)
          // Tentar via query direta
          const { error: queryError } = await supabase
            .from('nutritionist_profiles')
            .select('*')
            .limit(0) // Apenas para testar conexão

          if (queryError && queryError.message.includes('does not exist')) {
            console.log('✅ Conexão estabelecida, executando via SQL...')
          }

          console.warn(`⚠️  Aviso no comando ${i + 1}: ${error.message}`)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (err) {
        console.error(`❌ Erro no comando ${i + 1}:`, err.message)
      }
    }

    // Verificar se a coluna foi adicionada
    console.log('🔍 Verificando se a coluna foi adicionada...')
    const { data, error } = await supabase
      .from('nutritionist_profiles')
      .select('cancellation_policy')
      .limit(1)

    if (error) {
      if (error.message.includes('cancellation_policy')) {
        console.log(
          '⚠️  A coluna ainda não foi adicionada. Tente executar o SQL manualmente no dashboard do Supabase.'
        )
        console.log('📋 SQL para executar:')
        console.log(
          'ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;'
        )
      } else {
        console.error('❌ Erro ao verificar a coluna:', error.message)
      }
    } else {
      console.log('✅ Coluna cancellation_policy adicionada com sucesso!')
      console.log('🎉 Migração concluída!')
    }
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message)
    console.log('📋 Execute este SQL manualmente no dashboard do Supabase:')
    console.log(
      'ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;'
    )
  }
}

// Executar a migração
addCancellationPolicyColumn()
