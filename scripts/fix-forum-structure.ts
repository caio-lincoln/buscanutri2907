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

async function fixForumTables() {
  try {
    console.log('🔧 Corrigindo estrutura das tabelas do fórum...')

    // 1. Adicionar coluna author_id à tabela forum_questions se não existir
    console.log('\n📋 Adicionando coluna author_id à forum_questions...')
    try {
      const { error: addAuthorIdError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.forum_questions ADD COLUMN IF NOT EXISTS author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;',
      })

      if (addAuthorIdError && !addAuthorIdError.message.includes('exec_sql')) {
        console.log('❌ Erro ao adicionar author_id:', addAuthorIdError.message)
      } else {
        console.log(
          '✅ Coluna author_id adicionada/verificada em forum_questions'
        )
      }
    } catch (error) {
      console.log('⚠️  Tentativa alternativa para adicionar author_id...')
    }

    // 2. Adicionar coluna author_id à tabela forum_answers se não existir
    console.log('\n📋 Adicionando coluna author_id à forum_answers...')
    try {
      const { error: addAnswerAuthorIdError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.forum_answers ADD COLUMN IF NOT EXISTS author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;',
      })

      if (
        addAnswerAuthorIdError &&
        !addAnswerAuthorIdError.message.includes('exec_sql')
      ) {
        console.log(
          '❌ Erro ao adicionar author_id:',
          addAnswerAuthorIdError.message
        )
      } else {
        console.log(
          '✅ Coluna author_id adicionada/verificada em forum_answers'
        )
      }
    } catch (error) {
      console.log('⚠️  Tentativa alternativa para adicionar author_id...')
    }

    // 3. Criar tabela forum_question_likes se não existir
    console.log('\n📋 Criando tabela forum_question_likes...')
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.forum_question_likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(question_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_forum_question_likes_question_id ON public.forum_question_likes(question_id);
        CREATE INDEX IF NOT EXISTS idx_forum_question_likes_user_id ON public.forum_question_likes(user_id);
        
        ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;
      `

      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL,
      })

      if (createTableError && !createTableError.message.includes('exec_sql')) {
        console.log(
          '❌ Erro ao criar forum_question_likes:',
          createTableError.message
        )
      } else {
        console.log('✅ Tabela forum_question_likes criada/verificada')
      }
    } catch (error) {
      console.log('⚠️  Erro ao criar tabela forum_question_likes')
    }

    // 4. Verificar se as correções funcionaram
    console.log('\n🔍 Verificando correções...')

    // Testar forum_questions com author_id
    const { data: questions, error: questionsError } = await supabase
      .from('forum_questions')
      .select('id, title, author_id')
      .limit(1)

    if (questionsError) {
      console.log('❌ forum_questions ainda com erro:', questionsError.message)
    } else {
      console.log('✅ forum_questions funcionando corretamente')
    }

    // Testar forum_answers com author_id
    const { data: answers, error: answersError } = await supabase
      .from('forum_answers')
      .select('id, content, author_id')
      .limit(1)

    if (answersError) {
      console.log('❌ forum_answers ainda com erro:', answersError.message)
    } else {
      console.log('✅ forum_answers funcionando corretamente')
    }

    // Testar forum_question_likes
    const { data: questionLikes, error: questionLikesError } = await supabase
      .from('forum_question_likes')
      .select('id')
      .limit(1)

    if (questionLikesError) {
      console.log(
        '❌ forum_question_likes ainda com erro:',
        questionLikesError.message
      )
    } else {
      console.log('✅ forum_question_likes funcionando corretamente')
    }

    console.log('\n🎉 Correção das tabelas concluída!')
  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
  }
}

fixForumTables()
