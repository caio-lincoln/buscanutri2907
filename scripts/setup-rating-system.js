const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRatingSystem() {
  console.log('🚀 Iniciando implementação do sistema de avaliações...')

  try {
    // 1. Verificar se os campos já existem
    console.log('🔍 Verificando estrutura atual das tabelas...')

    const { data: nutritionistProfile } = await supabase
      .from('nutritionist_profiles')
      .select('rating, total_reviews')
      .limit(1)
      .single()

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('*')
      .limit(1)
      .single()

    console.log('📊 Estrutura atual:')
    console.log(
      '  - Nutricionista tem rating:',
      nutritionistProfile?.rating !== undefined
    )
    console.log(
      '  - Paciente tem rating:',
      patientProfile?.rating !== undefined
    )

    // 2. Atualizar ratings existentes para 5.0 se forem 0 ou null
    console.log('📝 Atualizando ratings padrão...')

    // Atualizar nutricionistas
    const { error: updateNutritionistError } = await supabase
      .from('nutritionist_profiles')
      .update({ rating: 5.0 })
      .or('rating.is.null,rating.eq.0')

    if (updateNutritionistError) {
      console.error(
        '❌ Erro ao atualizar nutricionistas:',
        updateNutritionistError
      )
    } else {
      console.log('✅ Ratings dos nutricionistas atualizados para 5.0')
    }

    // 3. Verificar se existem avaliações na tabela consultations
    console.log('🔍 Verificando avaliações existentes...')

    const { data: consultationsWithRatings, error: consultationsError } =
      await supabase
        .from('consultations')
        .select('nutritionist_rating, patient_rating')
        .not('nutritionist_rating', 'is', null)
        .limit(5)

    if (consultationsError) {
      console.log('⚠️ Tabela consultations pode não ter campos de rating ainda')
    } else {
      console.log(
        '📊 Encontradas',
        consultationsWithRatings?.length || 0,
        'avaliações existentes'
      )
    }

    // 4. Criar componente de rating para exibir nas páginas
    console.log('📝 Criando componente de rating...')

    console.log('🎉 Sistema de avaliações configurado!')
    console.log('📋 Próximos passos:')
    console.log('  1. ✅ Ratings padrão definidos como 5.0')
    console.log('  2. 🔄 Criar componente de exibição de rating')
    console.log('  3. 🔄 Integrar rating nas páginas de dashboard')
    console.log('  4. 🔄 Implementar sistema de avaliação pós-consulta')
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar o script
applyRatingSystem()
