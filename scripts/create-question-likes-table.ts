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

async function createQuestionLikesTable() {
  try {
    console.log('🔧 Criando tabela forum_question_likes...')
    
    // Tentar múltiplas abordagens para criar a tabela
    const approaches = [
      // Abordagem 1: SQL completo via exec_sql
      async () => {
        const sql = `
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
        
        const { error } = await supabase.rpc('exec_sql', { sql })
        return error
      },
      
      // Abordagem 2: Comandos separados
      async () => {
        const commands = [
          `CREATE TABLE IF NOT EXISTS public.forum_question_likes (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              UNIQUE(question_id, user_id)
          );`,
          `CREATE INDEX IF NOT EXISTS idx_forum_question_likes_question_id ON public.forum_question_likes(question_id);`,
          `CREATE INDEX IF NOT EXISTS idx_forum_question_likes_user_id ON public.forum_question_likes(user_id);`,
          `ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;`
        ]
        
        for (const command of commands) {
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          if (error && !error.message.includes('exec_sql')) {
            return error
          }
        }
        return null
      }
    ]
    
    let lastError = null
    
    for (let i = 0; i < approaches.length; i++) {
      console.log(`\n📋 Tentativa ${i + 1}...`)
      try {
        const error = await approaches[i]()
        if (!error || error.message.includes('exec_sql')) {
          console.log(`✅ Abordagem ${i + 1} executada`)
          break
        } else {
          console.log(`❌ Abordagem ${i + 1} falhou:`, error.message)
          lastError = error
        }
      } catch (e) {
        console.log(`❌ Abordagem ${i + 1} com exceção:`, e)
        lastError = e
      }
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...')
    
    try {
      const { data, error } = await supabase
        .from('forum_question_likes')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log('❌ Tabela ainda não existe:', error.message)
        
        // Mostrar SQL para criação manual
        console.log('\n📋 SQL para criação manual no Supabase Dashboard:')
        console.log(`
CREATE TABLE public.forum_question_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(question_id, user_id)
);

CREATE INDEX idx_forum_question_likes_question_id ON public.forum_question_likes(question_id);
CREATE INDEX idx_forum_question_likes_user_id ON public.forum_question_likes(user_id);

ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all question likes" ON public.forum_question_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own question likes" ON public.forum_question_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own question likes" ON public.forum_question_likes
    FOR DELETE USING (auth.uid() = user_id);
        `)
        
      } else {
        console.log('✅ Tabela forum_question_likes criada com sucesso!')
      }
    } catch (e) {
      console.log('❌ Erro na verificação:', e)
    }
    
    console.log('\n🎉 Processo concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createQuestionLikesTable()