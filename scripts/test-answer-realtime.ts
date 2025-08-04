import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAnswerRealtime() {
  console.log('🧪 Teste de inserção de resposta em tempo real...')

  const questionId = '7d28cc92-0694-419d-b9e1-0c04e840515c'

  try {
    // Primeiro, vamos verificar quais nutricionistas existem
    console.log('👩‍⚕️ Verificando nutricionistas disponíveis...')
    const { data: nutritionists, error: nutritionistsError } = await supabase
      .from('nutritionist_profiles')
      .select('id, user_id')
      .limit(5)

    if (nutritionistsError) {
      console.error('Erro ao buscar nutricionistas:', nutritionistsError)
      return
    }

    console.log('Nutricionistas encontrados:', nutritionists)

    if (!nutritionists || nutritionists.length === 0) {
      console.log('❌ Nenhum nutricionista encontrado. Não é possível inserir resposta.')
      return
    }

    const firstNutritionist = nutritionists[0]
    console.log(`✅ Usando nutricionista: ${firstNutritionist.id}`)

    // Aguardar 3 segundos para dar tempo de abrir a página
    console.log('⏳ Aguardando 3 segundos para você abrir a página...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Teste: Inserir uma nova resposta
    console.log('\n💬 Inserindo nova resposta...')
    const { data: answerData, error: answerError } = await supabase
      .from('forum_answers')
      .insert({
        question_id: questionId,
        content: `Esta é uma resposta de teste em tempo real! 🚀 Inserida em ${new Date().toLocaleTimeString()}`,
        author_id: firstNutritionist.user_id,
        nutritionist_id: firstNutritionist.id,
        likes_count: 0,
        is_best_answer: false
      })
      .select()

    if (answerError) {
      console.error('Erro ao inserir resposta:', answerError)
    } else {
      console.log('✅ Resposta inserida:', answerData)
    }

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Atualizar contador de respostas da pergunta
    console.log('\n📊 Atualizando contador de respostas para 6...')
    const { data: updateData, error: updateError } = await supabase
      .from('forum_questions')
      .update({ answers_count: 6 })
      .eq('id', questionId)
      .select()

    if (updateError) {
      console.error('Erro ao atualizar answers_count:', updateError)
    } else {
      console.log('✅ Contador de respostas atualizado para 6')
    }

    console.log('\n🎉 Teste concluído! Verifique se a nova resposta apareceu na interface em tempo real.')

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

testAnswerRealtime()