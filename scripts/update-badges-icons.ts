import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const out = (s: string) => process.stdout.write(`${s}\n`)
const err = (s: string) => process.stderr.write(`${s}\n`)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

const badgeIconMapping: Record<string, string> = {
  'Nutricionista Verificado': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/shield-check.svg',
  'Especialista em Emagrecimento': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/trending-down.svg',
  'Especialista em Esportes': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/dumbbell.svg',
  'Top Avaliado': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/star.svg',
  'Experiência 5+ Anos': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/calendar.svg',
  'Consultas Online': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg',
  'Resposta Rápida': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/zap.svg',
  'Planos Personalizados': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/clipboard-list.svg',
  'Consulta Online': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg',
}

async function updateBadgesWithIcons(): Promise<void> {
  try {
    out('🔄 Iniciando atualização de ícones das insígnias...')

    const { data: badges, error: fetchError } = await supabase
      .from('badges')
      .select('id, name, icon_url')

    if (fetchError) {
      err(`❌ Erro ao buscar insígnias: ${String(fetchError)}`)
      return
    }

    out(`📋 Encontradas ${(badges?.length || 0)} insígnias`)

    let updatedCount = 0

    for (const badge of badges || []) {
      if (badge.icon_url) {
        out(`⏭️  Insígnia "${badge.name}" já possui ícone, pulando...`)
        continue
      }

      const iconUrl = badgeIconMapping[badge.name]
      if (!iconUrl) {
        out(`⚠️  Nenhum ícone mapeado para "${badge.name}"`)
        continue
      }

      const { error: updateError } = await supabase
        .from('badges')
        .update({ icon_url: iconUrl })
        .eq('id', badge.id)

      if (updateError) {
        err(`❌ Erro ao atualizar "${badge.name}": ${String(updateError)}`)
        continue
      }

      out(`✅ Atualizada "${badge.name}" com ícone: ${iconUrl}`)
      updatedCount++
    }

    out(`\n🎉 Atualização concluída! ${updatedCount} insígnias foram atualizadas com ícones.`)
  } catch (error) {
    err(`❌ Erro geral: ${String(error)}`)
  }
}

updateBadgesWithIcons()
