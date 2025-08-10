const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testando configuração do Supabase...')
console.log('URL:', supabaseUrl)
console.log(
  'Service Key:',
  supabaseServiceKey ? 'Configurada ✅' : 'Não encontrada ❌'
)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas corretamente')
  process.exit(1)
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com o banco de dados...')

    // Testar conexão básica usando auth.users
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log(
        '⚠️  Sessão de auth não disponível, mas isso é normal para service role'
      )
    }

    // Testar uma consulta simples
    const { data: testData, error: testError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)

    if (testError) {
      console.log(
        '⚠️  Não foi possível acessar auth.users diretamente, tentando patient_profiles...'
      )

      // Tentar acessar patient_profiles diretamente
      const { data: patientData, error: patientError } = await supabase
        .from('patient_profiles')
        .select('id')
        .limit(1)

      if (patientError) {
        console.error(
          '❌ Erro ao acessar patient_profiles:',
          patientError.message
        )
        return false
      } else {
        console.log(
          '✅ Conexão estabelecida! Tabela patient_profiles acessível'
        )
        console.log('📋 Registros encontrados:', patientData.length)
        return true
      }
    } else {
      console.log('✅ Conexão estabelecida com sucesso!')
      console.log('📋 Usuários encontrados:', testData.length)

      // Agora testar patient_profiles
      const { data: patientData, error: patientError } = await supabase
        .from('patient_profiles')
        .select('id, user_id, full_name')
        .limit(5)

      if (patientError) {
        console.error(
          '❌ Erro ao acessar patient_profiles:',
          patientError.message
        )
        console.log(
          '💡 Isso pode indicar problemas com RLS ou estrutura da tabela'
        )
      } else {
        console.log('✅ Tabela patient_profiles acessível')
        console.log('📋 Perfis encontrados:', patientData.length)
        if (patientData.length > 0) {
          console.log('📄 Exemplo de dados:', patientData[0])
        }
      }

      return true
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    return false
  }
}

async function main() {
  const success = await testConnection()

  if (success) {
    console.log('\n✅ Configuração do Supabase está funcionando corretamente!')
    console.log(
      '💡 O problema pode estar na configuração do MCP, não nas credenciais.'
    )
  } else {
    console.log('\n❌ Há problemas na configuração do Supabase.')
  }
}

main().catch(console.error)
