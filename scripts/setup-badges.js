const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log(
    'Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupBadgesTables() {
  console.log('🚀 Configurando tabelas de badges...')

  try {
    // Verificar se as tabelas já existem
    console.log('🔍 Verificando se as tabelas já existem...')

    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('count')
      .limit(1)

    const { data: nutritionistBadges, error: nutritionistBadgesError } =
      await supabase.from('nutritionist_badges').select('count').limit(1)

    if (!badgesError) {
      console.log('✅ Tabela badges já existe')
    } else {
      console.log('⚠️ Tabela badges não encontrada:', badgesError.message)
    }

    if (!nutritionistBadgesError) {
      console.log('✅ Tabela nutritionist_badges já existe')
    } else {
      console.log(
        '⚠️ Tabela nutritionist_badges não encontrada:',
        nutritionistBadgesError.message
      )
    }

    // Se as tabelas não existem, mostrar instruções
    if (badgesError || nutritionistBadgesError) {
      console.log('\n📋 INSTRUÇÕES PARA CRIAR AS TABELAS:')
      console.log(
        '1. Acesse o painel do Supabase (https://supabase.com/dashboard)'
      )
      console.log('2. Vá para SQL Editor')
      console.log(
        '3. Execute o conteúdo do arquivo: scripts/create-badges-tables.sql'
      )
      console.log('\nOu execute manualmente os seguintes comandos SQL:')
      console.log('\n-- Criar tabela badges')
      console.log(`CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);`)
      console.log('\n-- Criar tabela nutritionist_badges')
      console.log(`CREATE TABLE IF NOT EXISTS public.nutritionist_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (nutritionist_id, badge_id)
);`)
      console.log('\n-- Habilitar RLS')
      console.log('ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;')
      console.log(
        'ALTER TABLE public.nutritionist_badges ENABLE ROW LEVEL SECURITY;'
      )
      console.log('\n-- Criar políticas')
      console.log(
        'CREATE POLICY "Enable read access for all users" ON public.badges FOR SELECT USING (true);'
      )
      console.log(
        'CREATE POLICY "Enable read access for all users" ON public.nutritionist_badges FOR SELECT USING (true);'
      )
      return
    }

    // Inserir algumas badges de exemplo se a tabela estiver vazia
    const { data: existingBadges } = await supabase
      .from('badges')
      .select('id')
      .limit(1)

    if (!existingBadges || existingBadges.length === 0) {
      console.log('📝 Inserindo badges de exemplo...')

      const sampleBadges = [
        {
          name: 'Verificado',
          description: 'Nutricionista verificado pela plataforma',
          icon_url:
            'https://cdn.jsdelivr.net/npm/lucide@latest/icons/shield-check.svg',
        },
        {
          name: 'Especialista em Esportes',
          description: 'Especialista em nutrição esportiva',
          icon_url:
            'https://cdn.jsdelivr.net/npm/lucide@latest/icons/trophy.svg',
        },
        {
          name: 'Top Avaliado',
          description: 'Entre os nutricionistas mais bem avaliados',
          icon_url: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/star.svg',
        },
        {
          name: 'Consulta Online',
          description: 'Oferece consultas online',
          icon_url:
            'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg',
        },
      ]

      const { error: insertError } = await supabase
        .from('badges')
        .insert(sampleBadges)

      if (insertError) {
        console.error('❌ Erro ao inserir badges de exemplo:', insertError)
      } else {
        console.log('✅ Badges de exemplo inseridas com sucesso')
      }
    } else {
      console.log('ℹ️ Badges já existem na tabela')
    }

    console.log('🎉 Verificação de badges concluída!')
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

setupBadgesTables()
