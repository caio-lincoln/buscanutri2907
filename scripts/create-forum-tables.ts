import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente do .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createForumTables() {
  console.log('🚀 Criando tabelas do fórum...')

  try {
    // Criar tabela forum_questions
    console.log('📝 Criando tabela forum_questions...')
    const { error: questionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.forum_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          tags TEXT[] DEFAULT '{}',
          views INTEGER DEFAULT 0,
          answers_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          is_answered BOOLEAN DEFAULT false,
          best_answer_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `,
    })

    if (questionsError) {
      console.error('❌ Erro ao criar forum_questions:', questionsError)
    } else {
      console.log('✅ Tabela forum_questions criada')
    }

    // Criar tabela forum_answers
    console.log('📝 Criando tabela forum_answers...')
    const { error: answersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.forum_answers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          likes_count INTEGER DEFAULT 0,
          is_accepted BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `,
    })

    if (answersError) {
      console.error('❌ Erro ao criar forum_answers:', answersError)
    } else {
      console.log('✅ Tabela forum_answers criada')
    }

    // Criar tabela forum_question_likes
    console.log('📝 Criando tabela forum_question_likes...')
    const { error: questionLikesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.forum_question_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(question_id, user_id)
        );
      `,
    })

    if (questionLikesError) {
      console.error(
        '❌ Erro ao criar forum_question_likes:',
        questionLikesError
      )
    } else {
      console.log('✅ Tabela forum_question_likes criada')
    }

    // Criar tabela forum_answer_likes
    console.log('📝 Criando tabela forum_answer_likes...')
    const { error: answerLikesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.forum_answer_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          answer_id UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(answer_id, user_id)
        );
      `,
    })

    if (answerLikesError) {
      console.error('❌ Erro ao criar forum_answer_likes:', answerLikesError)
    } else {
      console.log('✅ Tabela forum_answer_likes criada')
    }

    console.log('🎉 Tabelas do fórum criadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createForumTables()
