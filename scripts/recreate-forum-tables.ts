import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

// Criar cliente com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function recreateForumTables() {
  try {
    console.log('🔧 Recriando tabelas do fórum completamente...')
    
    // 1. Primeiro, vamos dropar as tabelas existentes para recriar corretamente
    console.log('\n🗑️  Removendo tabelas existentes...')
    
    const dropCommands = [
      'DROP TABLE IF EXISTS public.forum_question_likes CASCADE;',
      'DROP TABLE IF EXISTS public.forum_answer_likes CASCADE;',
      'DROP TABLE IF EXISTS public.forum_answers CASCADE;',
      'DROP TABLE IF EXISTS public.forum_questions CASCADE;'
    ]
    
    for (const command of dropCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error && !error.message.includes('exec_sql')) {
          console.log(`❌ Erro ao executar: ${command}`, error.message)
        }
      } catch (e) {
        console.log(`⚠️  Comando alternativo: ${command}`)
      }
    }
    
    // 2. Recriar todas as tabelas com a estrutura correta
    console.log('\n🏗️  Criando tabelas com estrutura correta...')
    
    const createTablesSQL = `
      -- Criar tabela forum_questions
      CREATE TABLE public.forum_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          category VARCHAR(100) DEFAULT 'geral',
          tags TEXT[] DEFAULT '{}',
          views_count INTEGER DEFAULT 0,
          answers_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          best_answer_id UUID,
          is_resolved BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Criar tabela forum_answers
      CREATE TABLE public.forum_answers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          likes_count INTEGER DEFAULT 0,
          is_best_answer BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Criar tabela forum_question_likes
      CREATE TABLE public.forum_question_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(question_id, user_id)
      );

      -- Criar tabela forum_answer_likes
      CREATE TABLE public.forum_answer_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          answer_id UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(answer_id, user_id)
      );

      -- Adicionar foreign key para best_answer_id
      ALTER TABLE public.forum_questions 
      ADD CONSTRAINT fk_forum_questions_best_answer 
      FOREIGN KEY (best_answer_id) REFERENCES public.forum_answers(id) ON DELETE SET NULL;

      -- Criar índices
      CREATE INDEX idx_forum_questions_author_id ON public.forum_questions(author_id);
      CREATE INDEX idx_forum_questions_category ON public.forum_questions(category);
      CREATE INDEX idx_forum_questions_created_at ON public.forum_questions(created_at DESC);
      CREATE INDEX idx_forum_answers_question_id ON public.forum_answers(question_id);
      CREATE INDEX idx_forum_answers_author_id ON public.forum_answers(author_id);
      CREATE INDEX idx_forum_question_likes_question_id ON public.forum_question_likes(question_id);
      CREATE INDEX idx_forum_question_likes_user_id ON public.forum_question_likes(user_id);
      CREATE INDEX idx_forum_answer_likes_answer_id ON public.forum_answer_likes(answer_id);
      CREATE INDEX idx_forum_answer_likes_user_id ON public.forum_answer_likes(user_id);

      -- Habilitar RLS
      ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.forum_answer_likes ENABLE ROW LEVEL SECURITY;
    `
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
      if (error && !error.message.includes('exec_sql')) {
        console.log('❌ Erro ao criar tabelas:', error.message)
      } else {
        console.log('✅ Tabelas criadas com sucesso')
      }
    } catch (e) {
      console.log('⚠️  Erro ao executar SQL de criação')
    }
    
    // 3. Verificar se as tabelas foram criadas corretamente
    console.log('\n🔍 Verificando tabelas criadas...')
    
    const tables = ['forum_questions', 'forum_answers', 'forum_question_likes', 'forum_answer_likes']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: OK`)
        }
      } catch (e) {
        console.log(`❌ ${table}: Erro na verificação`)
      }
    }
    
    console.log('\n🎉 Recriação das tabelas concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a recriação:', error)
  }
}

recreateForumTables()
