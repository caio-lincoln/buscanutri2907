import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('URL:', supabaseUrl ? 'Configurada' : 'Não encontrada')
  console.log('Key:', supabaseKey ? 'Configurada' : 'Não encontrada')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Testar uma consulta simples
    const { data, error } = await supabase
      .from('nutritionist_profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Erro na consulta:', error)
      process.exit(1)
    }

    console.log('✅ Conexão com Supabase funcionando!')
    console.log('📊 Registros encontrados:', data?.length || 0)
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
    process.exit(1)
  }
}

testSupabaseConnection()
