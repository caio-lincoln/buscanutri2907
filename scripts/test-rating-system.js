const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRatingSystem() {
  console.log('🧪 Testando sistema de avaliação de consultas...\n')

  try {
    // 1. Verificar se a tabela consultation_ratings existe
    console.log('1. Verificando tabela consultation_ratings...')
    const { data: ratingsTable, error: tableError } = await supabase
      .from('consultation_ratings')
      .select('*')
      .limit(1)

    if (tableError) {
      console.log('❌ Erro ao verificar tabela:', tableError.message)
      return
    }
    console.log('✅ Tabela consultation_ratings existe\n')

    // 2. Buscar algumas consultas completadas
    console.log('2. Buscando consultas completadas...')
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select(`
        id,
        patient_id,
        nutritionist_id,
        status,
        start_time,
        nutritionist_profiles(full_name)
      `)
      .eq('status', 'completed')
      .limit(5)

    if (consultationsError) {
      console.log('❌ Erro ao buscar consultas:', consultationsError.message)
      return
    }

    console.log(`✅ Encontradas ${consultations.length} consultas completadas`)
    consultations.forEach(c => {
      console.log(`   - ${c.nutritionist_profiles?.full_name || 'Nutricionista'} (${c.id})`)
    })
    console.log()

    if (consultations.length === 0) {
      console.log('⚠️ Nenhuma consulta completa encontrada para teste')
      return
    }

    // 3. Verificar se já existem avaliações
    console.log('3. Verificando avaliações existentes...')
    const { data: existingRatings, error: ratingsError } = await supabase
      .from('consultation_ratings')
      .select('*')
      .limit(5)

    if (ratingsError) {
      console.log('❌ Erro ao buscar avaliações:', ratingsError.message)
      return
    }

    console.log(`✅ Encontradas ${existingRatings.length} avaliações existentes`)
    existingRatings.forEach(r => {
      console.log(`   - Consulta ${r.consultation_id}: ${r.rating} estrelas`)
    })
    console.log()

    // 4. Testar criação de uma avaliação
    console.log('4. Testando criação de avaliação...')
    const testConsultation = consultations[0]
    
    // Verificar se já foi avaliada
    const { data: existingRating } = await supabase
      .from('consultation_ratings')
      .select('id')
      .eq('consultation_id', testConsultation.id)
      .single()

    if (existingRating) {
      console.log('⚠️ Consulta já foi avaliada, testando atualização...')
      
      // Testar atualização
      const { data: updatedRating, error: updateError } = await supabase
        .from('consultation_ratings')
        .update({ rating: 5, comment: 'Teste de atualização - Excelente atendimento!' })
        .eq('consultation_id', testConsultation.id)
        .select()
        .single()

      if (updateError) {
        console.log('❌ Erro ao atualizar avaliação:', updateError.message)
      } else {
        console.log('✅ Avaliação atualizada com sucesso')
        console.log(`   - Rating: ${updatedRating.rating} estrelas`)
        console.log(`   - Comentário: ${updatedRating.comment}`)
      }
    } else {
      // Criar nova avaliação
      const { data: newRating, error: createError } = await supabase
        .from('consultation_ratings')
        .insert({
          consultation_id: testConsultation.id,
          patient_id: testConsultation.patient_id,
          nutritionist_id: testConsultation.nutritionist_id,
          rating: 5,
          comment: 'Teste de criação - Atendimento excelente!'
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ Erro ao criar avaliação:', createError.message)
      } else {
        console.log('✅ Avaliação criada com sucesso')
        console.log(`   - Rating: ${newRating.rating} estrelas`)
        console.log(`   - Comentário: ${newRating.comment}`)
      }
    }
    console.log()

    // 5. Testar busca de estatísticas do nutricionista
    console.log('5. Testando estatísticas do nutricionista...')
    const testNutritionistId = testConsultation.nutritionist_id
    
    const { data: nutritionistStats, error: statsError } = await supabase
      .from('nutritionist_profiles')
      .select('rating, total_reviews')
      .eq('user_id', testNutritionistId)
      .single()

    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError.message)
    } else {
      console.log('✅ Estatísticas do nutricionista:')
      console.log(`   - Rating médio: ${nutritionistStats.rating}`)
      console.log(`   - Total de avaliações: ${nutritionistStats.total_reviews}`)
    }
    console.log()

    // 6. Testar busca de avaliações de um nutricionista
    console.log('6. Testando busca de avaliações do nutricionista...')
    const { data: nutritionistRatings, error: nutritionistRatingsError } = await supabase
      .from('consultation_ratings')
      .select(`
        *,
        patient_profiles(full_name)
      `)
      .eq('nutritionist_id', testNutritionistId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (nutritionistRatingsError) {
      console.log('❌ Erro ao buscar avaliações do nutricionista:', nutritionistRatingsError.message)
    } else {
      console.log(`✅ Encontradas ${nutritionistRatings.length} avaliações do nutricionista:`)
      nutritionistRatings.forEach(r => {
        console.log(`   - ${r.patient_profiles?.full_name || 'Paciente'}: ${r.rating} estrelas`)
        if (r.comment) {
          console.log(`     Comentário: ${r.comment}`)
        }
      })
    }
    console.log()

    // 7. Testar notificações
    console.log('7. Testando sistema de notificações...')
    const { data: notifications, error: notificationsError } = await supabase
      .from('realtime_notifications')
      .select('*')
      .in('type', ['rating_reminder', 'rating_received'])
      .limit(5)

    if (notificationsError) {
      console.log('❌ Erro ao buscar notificações:', notificationsError.message)
    } else {
      console.log(`✅ Encontradas ${notifications.length} notificações de avaliação:`)
      notifications.forEach(n => {
        console.log(`   - ${n.type}: ${n.title}`)
        console.log(`     ${n.message}`)
      })
    }
    console.log()

    console.log('🎉 Teste do sistema de avaliação concluído com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar o teste
testRatingSystem()
