import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias'
  )
  process.exit(1)
}

// Criar cliente com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testForumTables() {
  try {
    console.log('🔍 Testando estrutura das tabelas do fórum...')

    // Testar forum_questions
    console.log('\n📋 Testando forum_questions...')
    const { data: questions, error: questionsError } = await supabase
      .from('forum_questions')
      .select('id, title, author_id, created_at')
      .limit(5)

    if (questionsError) {
      console.log('❌ Erro em forum_questions:', questionsError.message)
    } else {
      console.log(
        '✅ forum_questions OK - Registros encontrados:',
        questions?.length || 0
      )
      if (questions && questions.length > 0) {
        console.log('📄 Exemplo:', questions[0])
      }
    }

    // Testar forum_answers
    console.log('\n📋 Testando forum_answers...')
    const { data: answers, error: answersError } = await supabase
      .from('forum_answers')
      .select('id, content, author_id, question_id, created_at')
      .limit(5)

    if (answersError) {
      console.log('❌ Erro em forum_answers:', answersError.message)
    } else {
      console.log(
        '✅ forum_answers OK - Registros encontrados:',
        answers?.length || 0
      )
      if (answers && answers.length > 0) {
        console.log('📄 Exemplo:', answers[0])
      }
    }

    // Testar forum_answer_likes
    console.log('\n📋 Testando forum_answer_likes...')
    const { data: answerLikes, error: answerLikesError } = await supabase
      .from('forum_answer_likes')
      .select('id, answer_id, user_id, created_at')
      .limit(5)

    if (answerLikesError) {
      console.log('❌ Erro em forum_answer_likes:', answerLikesError.message)
    } else {
      console.log(
        '✅ forum_answer_likes OK - Registros encontrados:',
        answerLikes?.length || 0
      )
    }

    // Testar forum_question_likes
    console.log('\n📋 Testando forum_question_likes...')
    const { data: questionLikes, error: questionLikesError } = await supabase
      .from('forum_question_likes')
      .select('id, question_id, user_id, created_at')
      .limit(5)

    if (questionLikesError) {
      console.log(
        '❌ Erro em forum_question_likes:',
        questionLikesError.message
      )
    } else {
      console.log(
        '✅ forum_question_likes OK - Registros encontrados:',
        questionLikes?.length || 0
      )
    }

    // Testar inserção de dados simples
    console.log('\n🧪 Testando inserção de dados...')

    // Primeiro, verificar se existe algum usuário na tabela auth.users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers()

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log('👥 Usuários encontrados:', users?.users?.length || 0)

      if (users?.users && users.users.length > 0) {
        const testUserId = users.users[0].id
        console.log('🧪 Usando usuário para teste:', testUserId)

        // Tentar inserir uma pergunta de teste
        const { data: testQuestion, error: insertError } = await supabase
          .from('forum_questions')
          .insert({
            title: 'Pergunta de Teste',
            content:
              'Esta é uma pergunta de teste para verificar se a inserção funciona.',
            author_id: testUserId,
            tags: ['teste'],
          })
          .select()
          .single()

        if (insertError) {
          console.log(
            '❌ Erro ao inserir pergunta de teste:',
            insertError.message
          )
        } else {
          console.log(
            '✅ Pergunta de teste inserida com sucesso:',
            testQuestion?.id
          )

          // Limpar dados de teste
          await supabase
            .from('forum_questions')
            .delete()
            .eq('id', testQuestion.id)
          console.log('🧹 Dados de teste removidos')
        }
      } else {
        console.log('⚠️  Nenhum usuário encontrado para teste')
      }
    }

    console.log('\n🎉 Teste concluído!')
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testForumTables()
