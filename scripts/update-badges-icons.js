const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mapeamento de insígnias para ícones apropriados
const badgeIconMapping = {
  'Nutricionista Verificado': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/shield-check.svg',
  'Especialista em Emagrecimento': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/trending-down.svg',
  'Especialista em Esportes': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/dumbbell.svg',
  'Top Avaliado': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/star.svg',
  'Experiência 5+ Anos': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/calendar.svg',
  'Consultas Online': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg',
  'Resposta Rápida': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/zap.svg',
  'Planos Personalizados': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/clipboard-list.svg',
  'Consulta Online': 'https://cdn.jsdelivr.net/npm/lucide@latest/icons/video.svg'
}

async function updateBadgesWithIcons() {
  try {
    console.log('🔄 Iniciando atualização de ícones das insígnias...')
    
    // Buscar todas as insígnias
    const { data: badges, error: fetchError } = await supabase
      .from('badges')
      .select('id, name, icon_url')
    
    if (fetchError) {
      console.error('❌ Erro ao buscar insígnias:', fetchError)
      return
    }
    
    console.log(`📋 Encontradas ${badges.length} insígnias`)
    
    let updatedCount = 0
    
    for (const badge of badges) {
      // Verificar se já tem ícone
      if (badge.icon_url) {
        console.log(`⏭️  Insígnia "${badge.name}" já possui ícone, pulando...`)
        continue
      }
      
      // Buscar ícone correspondente
      const iconUrl = badgeIconMapping[badge.name]
      
      if (!iconUrl) {
        console.log(`⚠️  Nenhum ícone mapeado para "${badge.name}"`)
        continue
      }
      
      // Atualizar insígnia com ícone
      const { error: updateError } = await supabase
        .from('badges')
        .update({ icon_url: iconUrl })
        .eq('id', badge.id)
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar "${badge.name}":`, updateError)
        continue
      }
      
      console.log(`✅ Atualizada "${badge.name}" com ícone: ${iconUrl}`)
      updatedCount++
    }
    
    console.log(`\n🎉 Atualização concluída! ${updatedCount} insígnias foram atualizadas com ícones.`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar o script
updateBadgesWithIcons()