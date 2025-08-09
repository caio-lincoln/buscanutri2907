import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSimpleRealtime() {
  console.log('🧪 Teste simples de tempo real...')

  const questionId = '7d28cc92-0694-419d-b9e1-0c04e840515c'

  try {
    // Aguardar 3 segundos para dar tempo de abrir a página
    console.log('⏳ Aguardando 3 segundos para você abrir a página...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Teste: Atualizar contador de likes da pergunta
    console.log('\n🔄 Atualizando contador de likes da pergunta para 10...')
    const { data: updateData, error: updateError } = await supabase
      .from('forum_questions')
      .update({ likes_count: 10 })
      .eq('id', questionId)
      .select()

    if (updateError) {
      console.error('Erro ao atualizar likes_count:', updateError)
    } else {
      console.log('✅ Contador de likes atualizado para 10')
    }

    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Teste 2: Atualizar contador de visualizações
    console.log('\n👀 Atualizando contador de visualizações para 50...')
    const { data: viewsData, error: viewsError } = await supabase
      .from('forum_questions')
      .update({ views: 50 })
      .eq('id', questionId)
      .select()

    if (viewsError) {
      console.error('Erro ao atualizar views:', viewsError)
    } else {
      console.log('✅ Contador de visualizações atualizado para 50')
    }

    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Teste 3: Atualizar contador de respostas
    console.log('\n💬 Atualizando contador de respostas para 5...')
    const { data: answersData, error: answersError } = await supabase
      .from('forum_questions')
      .update({ answers_count: 5 })
      .eq('id', questionId)
      .select()

    if (answersError) {
      console.error('Erro ao atualizar answers_count:', answersError)
    } else {
      console.log('✅ Contador de respostas atualizado para 5')
    }

    console.log('\n🎉 Teste concluído! Verifique se os números mudaram na interface em tempo real.')

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

testSimpleRealtime()
