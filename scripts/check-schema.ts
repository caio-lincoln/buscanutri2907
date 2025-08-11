import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

async function checkSchema() {
  console.log('🔍 Verificando estrutura da tabela nutritionist_profiles...')

  // Verificar estrutura da tabela
  const { data: schemaData, error: schemaError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'nutritionist_profiles')
    .in('column_name', ['specialties', 'languages'])

  if (schemaError) {
    console.error('❌ Erro ao verificar schema:', schemaError)

    // Tentar uma abordagem alternativa
    console.log('\n🔄 Tentando abordagem alternativa...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('nutritionist_profiles')
      .select('specialties, languages')
      .limit(1)
      .single()

    if (sampleError) {
      console.error('❌ Erro ao buscar dados de exemplo:', sampleError)
    } else {
      console.log('📋 Dados de exemplo:')
      console.log(
        'specialties:',
        sampleData.specialties,
        '(tipo:',
        typeof sampleData.specialties,
        ')'
      )
      console.log(
        'languages:',
        sampleData.languages,
        '(tipo:',
        typeof sampleData.languages,
        ')'
      )
    }
  } else {
    console.log('📋 Estrutura da tabela:')
    console.table(schemaData)
  }
}

checkSchema().catch(console.error)
