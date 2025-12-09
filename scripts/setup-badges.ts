import { createClient } from '@supabase/supabase-js'

const out = (s: string) => process.stdout.write(`${s}\n`)
const err = (s: string) => process.stderr.write(`${s}\n`)

async function setupBadgesTables(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    err('❌ Variáveis de ambiente do Supabase não encontradas')
    out('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
    process.exitCode = 1
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  out('🚀 Configurando tabelas de badges...')

  try {
    out('🔍 Verificando se as tabelas já existem...')

    const { error: badgesError } = await supabase
      .from('badges')
      .select('count')
      .limit(1)

    const { error: nutritionistBadgesError } = await supabase
      .from('nutritionist_badges')
      .select('count')
      .limit(1)

    if (!badgesError) {
      out('✅ Tabela badges já existe')
    } else {
      out(`⚠️ Tabela badges não encontrada: ${String(badgesError.message ?? badgesError)}`)
    }

    if (!nutritionistBadgesError) {
      out('✅ Tabela nutritionist_badges já existe')
    } else {
      out(`⚠️ Tabela nutritionist_badges não encontrada: ${String(nutritionistBadgesError.message ?? nutritionistBadgesError)}`)
    }

    if (badgesError || nutritionistBadgesError) {
      out('\n📋 INSTRUÇÕES PARA CRIAR AS TABELAS:')
      out('1. Acesse o painel do Supabase (https://supabase.com/dashboard)')
      out('2. Vá para SQL Editor')
      out('3. Execute o conteúdo do arquivo: scripts/create-badges-tables.sql')
      out('\nOu execute manualmente os seguintes comandos SQL:')
      out('\n-- Criar tabela badges')
      out('CREATE TABLE IF NOT EXISTS public.badges (\n  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n  name text NOT NULL,\n  description text,\n  icon_url text,\n  created_at timestamp with time zone DEFAULT now() NOT NULL\n);')
      out('\n-- Criar tabela nutritionist_badges')
      out('CREATE TABLE IF NOT EXISTS public.nutritionist_badges (\n  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n  nutritionist_id uuid NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,\n  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,\n  assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,\n  assigned_at timestamp with time zone DEFAULT now() NOT NULL,\n  UNIQUE (nutritionist_id, badge_id)\n);')
      out('\n-- Habilitar RLS')
      out('ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;')
      out('ALTER TABLE public.nutritionist_badges ENABLE ROW LEVEL SECURITY;')
      out('\n-- Criar políticas')
      out('CREATE POLICY "Enable read access for all users" ON public.badges FOR SELECT USING (true);')
      out('CREATE POLICY "Enable read access for all users" ON public.nutritionist_badges FOR SELECT USING (true);')
      return
    }

    const { data: existingBadges } = await supabase
      .from('badges')
      .select('id')
      .limit(1)

    if (!existingBadges || existingBadges.length === 0) {
      out('📝 Inserindo badges de exemplo...')

      const sampleBadges = [
        { name: 'Verificado', description: 'Nutricionista verificado pela plataforma', icon_url: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/shield-check.svg' },
        { name: 'Especialista em Esportes', description: 'Especialista em nutrição esportiva', icon_url: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/trophy.svg' },
        { name: 'Top Avaliado', description: 'Entre os nutricionistas mais bem avaliados', icon_url: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/star.svg' },
        { name: 'Consulta Online', description: 'Oferece consultas online', icon_url: 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg' },
      ]

      const { error: insertError } = await supabase
        .from('badges')
        .insert(sampleBadges)

      if (insertError) {
        err(`❌ Erro ao inserir badges de exemplo: ${String(insertError)}`)
      } else {
        out('✅ Badges de exemplo inseridas com sucesso')
      }
    } else {
      out('ℹ️ Badges já existem na tabela')
    }

    out('🎉 Verificação de badges concluída!')
  } catch (error) {
    err(`❌ Erro geral: ${String(error)}`)
    process.exitCode = 1
  }
}

setupBadgesTables()
