const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQLCommands(sqlContent) {
  // Dividir o SQL em comandos individuais
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

  for (const command of commands) {
    if (command.trim()) {
      try {
        console.log(`Executando: ${command.substring(0, 100)}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        })

        if (error) {
          console.error(`❌ Erro: ${error.message}`)
          // Continuar com próximo comando mesmo se houver erro
        } else {
          console.log('✅ Sucesso')
        }
      } catch (err) {
        console.error(`❌ Erro na execução: ${err.message}`)
      }
    }
  }
}

async function applyMissingMigrations() {
  console.log('🔧 Aplicando migrações faltantes...\n')

  // SQL para criar as tabelas faltantes
  const createTablesSQL = `
-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de comentários
CREATE TABLE IF NOT EXISTS public.blog_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de curtidas de posts
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(post_id, ip_address)
);

-- Criar tabela de curtidas de comentários
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.blog_post_comments(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id),
  UNIQUE(comment_id, ip_address)
);

-- Criar tabela de compartilhamentos
CREATE TABLE IF NOT EXISTS public.blog_post_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO public.blog_categories (name, slug, description) VALUES
('Receitas Saudáveis', 'receitas-saudaveis', 'Receitas nutritivas e saborosas'),
('Emagrecimento', 'emagrecimento', 'Dicas para perda de peso saudável'),
('Alimentação Infantil', 'alimentacao-infantil', 'Nutrição para crianças e adolescentes'),
('Bem-Estar', 'bem-estar', 'Saúde mental e física através da alimentação'),
('Suplementação', 'suplementacao', 'Guias sobre vitaminas e suplementos'),
('Doenças Crônicas', 'doencas-cronicas', 'Nutrição para diabetes, hipertensão, etc.')
ON CONFLICT (slug) DO NOTHING;
  `

  try {
    // Executar comandos SQL
    await executeSQLCommands(createTablesSQL)
    
    console.log('\n✅ Migrações aplicadas com sucesso!')
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...')
    
    const tablesToCheck = [
      'blog_categories',
      'blog_tags', 
      'blog_post_comments',
      'blog_post_likes',
      'blog_comment_likes',
      'blog_post_shares'
    ]

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: Criada com sucesso`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

applyMissingMigrations()