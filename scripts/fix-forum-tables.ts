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

async function createMissingTable() {
  try {
    console.log('🚀 Criando tabela forum_question_likes...')

    // SQL para criar a tabela forum_question_likes
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
      
      CREATE POLICY "Likes em perguntas são visíveis para todos" 
      ON public.forum_question_likes FOR SELECT 
      USING (true);

      CREATE POLICY "Usuários autenticados podem dar like em perguntas" 
      ON public.forum_question_likes FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Usuários podem remover seus likes em perguntas" 
      ON public.forum_question_likes FOR DELETE 
      USING (auth.uid() = user_id);
    `

    // Tentar criar usando uma query direta
    const { error } = await supabase
      .from('forum_questions')
      .select('id')
      .limit(1)

    if (!error) {
      console.log('✅ Conexão estabelecida, tabelas do fórum já existem!')

      // Verificar se forum_question_likes existe
      const { error: likesError } = await supabase
        .from('forum_question_likes')
        .select('id')
        .limit(1)

      if (likesError && likesError.message.includes('does not exist')) {
        console.log(
          '⚠️  Tabela forum_question_likes não existe, mas não conseguimos criá-la via API'
        )
        console.log(
          '📝 Por favor, execute o seguinte SQL no Supabase Dashboard:'
        )
        console.log(createTableSQL)
      } else {
        console.log('✅ Tabela forum_question_likes já existe!')
      }
    }

    console.log('🎉 Verificação concluída!')
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

createMissingTable()
