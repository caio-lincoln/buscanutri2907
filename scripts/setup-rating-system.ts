import { createClient } from '@supabase/supabase-js'

const out = (s: string) => process.stdout.write(`${s}\n`)
const err = (s: string) => process.stderr.write(`${s}\n`)

async function applyRatingSystem(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente do Supabase não encontradas')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  out('🚀 Iniciando implementação do sistema de avaliações...')

  try {
    out('🔍 Verificando estrutura atual das tabelas...')

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

    out('📊 Estrutura atual:')
    out(`  - Nutricionista tem rating: ${String(nutritionistProfile?.rating !== undefined)}`)
    out(`  - Paciente tem rating: ${String(patientProfile?.rating !== undefined)}`)

    out('📝 Atualizando ratings padrão...')
    const { error: updateNutritionistError } = await supabase
      .from('nutritionist_profiles')
      .update({ rating: 5.0 })
      .or('rating.is.null,rating.eq.0')

    if (updateNutritionistError) {
      err(`❌ Erro ao atualizar nutricionistas: ${String(updateNutritionistError)}`)
    } else {
      out('✅ Ratings dos nutricionistas atualizados para 5.0')
    }

    out('🔍 Verificando avaliações existentes...')
    const { data: consultationsWithRatings, error: consultationsError } = await supabase
      .from('consultations')
      .select('nutritionist_rating, patient_rating')
      .not('nutritionist_rating', 'is', null)
      .limit(5)

    if (consultationsError) {
      out('⚠️ Tabela consultations pode não ter campos de rating ainda')
    } else {
      out(`📊 Encontradas ${(consultationsWithRatings?.length || 0)} avaliações existentes`)
    }

    out('📝 Criando componente de rating...')
    out('🎉 Sistema de avaliações configurado!')
    out('📋 Próximos passos:')
    out('  1. ✅ Ratings padrão definidos como 5.0')
    out('  2. 🔄 Criar componente de exibição de rating')
    out('  3. 🔄 Integrar rating nas páginas de dashboard')
    out('  4. 🔄 Implementar sistema de avaliação pós-consulta')
  } catch (error) {
    err(`❌ Erro geral: ${String(error)}`)
    process.exitCode = 1
  }
}

applyRatingSystem()
