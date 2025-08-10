import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testRealtime() {
  console.log('🧪 Testando funcionalidades em tempo real...')

  const questionId = '7d28cc92-0694-419d-b9e1-0c04e840515c'
  const userId = '0cd50cf6-4d3e-4dce-9d47-c8a70b4e514e' // Ryan Ebert (nutricionista)

  try {
    // Teste 1: Inserir um like na pergunta
    console.log('\n1️⃣ Inserindo like na pergunta...')
    const { data: likeData, error: likeError } = await supabase
      .from('forum_question_likes')
      .insert({
        question_id: questionId,
        user_id: userId,
      })
      .select()

    if (likeError) {
      console.error('Erro ao inserir like:', likeError)
    } else {
      console.log('✅ Like inserido:', likeData)
    }

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Teste 2: Atualizar contador de likes da pergunta
    console.log('\n2️⃣ Atualizando contador de likes da pergunta...')
    const { data: _updateData, error: updateError } = await supabase
      .from('forum_questions')
      .update({ likes_count: 9 }) // Era 8, agora 9
      .eq('id', questionId)
      .select()

    if (updateError) {
      console.error('Erro ao atualizar likes_count:', updateError)
    } else {
      console.log('✅ Contador de likes atualizado:', updateData)
    }

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Teste 3: Inserir uma nova resposta
    console.log('\n3️⃣ Inserindo nova resposta...')
    const { data: answerData, error: answerError } = await supabase
      .from('forum_answers')
      .insert({
        question_id: questionId,
        content: 'Esta é uma resposta de teste para verificar o tempo real! 🚀',
        author_id: userId,
        nutritionist_id: userId,
        likes_count: 0,
        is_best_answer: false,
      })
      .select()

    if (answerError) {
      console.error('Erro ao inserir resposta:', answerError)
    } else {
      console.log('✅ Resposta inserida:', answerData)
    }

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Teste 4: Atualizar contador de respostas da pergunta
    console.log('\n4️⃣ Atualizando contador de respostas da pergunta...')
    const { data: answersCountData, error: answersCountError } = await supabase
      .from('forum_questions')
      .update({ answers_count: 4 }) // Era 3, agora 4
      .eq('id', questionId)
      .select()

    if (answersCountError) {
      console.error('Erro ao atualizar answers_count:', answersCountError)
    } else {
      console.log('✅ Contador de respostas atualizado:', answersCountData)
    }

    console.log(
      '\n🎉 Teste concluído! Verifique a interface para ver as atualizações em tempo real.'
    )
  } catch (error) {
    console.error('Erro geral:', error)
  }
}

testRealtime()
