import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { normalizeStringArray } from '../lib/structured-data-utils'

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

async function fixStructuredData() {
  console.log('🔧 Iniciando correção de dados estruturados...')
  
  let fixedCount = 0
  let errorCount = 0

  // Corrige problemas na tabela nutritionist_profiles
  console.log('\n👨‍⚕️ Corrigindo nutritionist_profiles...')
  
  const { data: profiles, error: profilesError } = await supabase
    .from('nutritionist_profiles')
    .select('id, specialties')
  
  if (profilesError) {
    console.error('❌ Erro ao buscar perfis:', profilesError)
    return
  }

  console.log(`📋 Encontrados ${profiles.length} perfis para verificar`)

  for (const profile of profiles) {
    try {
      // Verifica se specialties é uma string que precisa ser normalizada
      if (typeof profile.specialties === 'string') {
        const trimmed = profile.specialties.trim()
        let needsNormalization = false
        let normalizedData = null
        
        // Caso 1: JSON válido (arrays)
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          needsNormalization = true
        }
        // Caso 2: String separada por vírgulas
        else if (trimmed.includes(',') && !trimmed.startsWith('[')) {
          needsNormalization = true
        }
        
        if (needsNormalization) {
          console.log(`🔄 Corrigindo perfil ${profile.id}...`)
          console.log(`   Original: ${profile.specialties}`)
          
          // Normaliza usando nossa função utilitária
          const normalized = normalizeStringArray(profile.specialties)
          
          console.log(`   Normalizado: ${JSON.stringify(normalized.data)}`)
          console.log(`   Foi corrompido: ${normalized.wasCorrupted}`)
          
          // Atualiza no banco
          const { error: updateError } = await supabase
            .from('nutritionist_profiles')
            .update({ 
              specialties: normalized.data,
              // Adiciona um campo de backup se foi corrompido
              ...(normalized.wasCorrupted && {
                specialties_raw_backup: JSON.stringify({
                  originalValue: profile.specialties,
                  timestamp: new Date().toISOString(),
                  reason: 'data_normalization'
                })
              })
            })
            .eq('id', profile.id)
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar perfil ${profile.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Perfil ${profile.id} corrigido com sucesso`)
            fixedCount++
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar perfil ${profile.id}:`, error)
      errorCount++
    }
  }

  console.log('\n📊 RELATÓRIO DE CORREÇÃO:')
  console.log(`✅ Registros corrigidos: ${fixedCount}`)
  console.log(`❌ Erros encontrados: ${errorCount}`)
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correção concluída! Execute o monitoramento novamente para verificar.')
  }
}

// Executa a correção
fixStructuredData().catch(console.error)