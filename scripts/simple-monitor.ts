import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

async function simpleHealthCheck() {
  console.log('🔍 Executando verificação simples de saúde dos dados...')
  
  const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)
  
  const issues: any[] = []
  
  try {
    // Verificar nutritionist_profiles
    console.log('📋 Verificando nutritionist_profiles...')
    const { data: nutritionists, error: nutError } = await supabase
      .from('nutritionist_profiles')
      .select('id, specialties, languages')
      .not('specialties', 'is', null)
      .limit(10)
    
    if (nutError) {
      console.error('❌ Erro ao consultar nutritionist_profiles:', nutError)
    } else {
      console.log(`✅ Encontrados ${nutritionists?.length || 0} perfis de nutricionistas`)
      
      // Verificar problemas nos dados
      for (const profile of nutritionists || []) {
        if (typeof profile.specialties === 'string') {
          const trimmed = profile.specialties.trim()
          
          // Verifica se é um JSON válido
          try {
            const parsed = JSON.parse(profile.specialties)
            
            // Se é um array válido, está OK
            if (Array.isArray(parsed)) {
              // Dados corretos - array serializado como JSON
              continue
            } else {
              // JSON válido mas não é array
              issues.push({
                table: 'nutritionist_profiles',
                field: 'specialties',
                id: profile.id,
                issue: 'JSON válido mas não é array'
              })
            }
          } catch {
            // Não é JSON válido - pode ser string simples ou dados corrompidos
            if (trimmed.includes(',') || trimmed.includes('[') || trimmed.includes('{')) {
              // Parece ser dados estruturados mal formatados
              issues.push({
                table: 'nutritionist_profiles',
                field: 'specialties',
                id: profile.id,
                issue: 'Dados estruturados mal formatados'
              })
            } else if (trimmed.length > 100) {
              // String muito longa pode ser dados corrompidos
              issues.push({
                table: 'nutritionist_profiles',
                field: 'specialties',
                id: profile.id,
                issue: 'String muito longa (possível corrupção)'
              })
            }
            // Strings simples e curtas são OK
          }
        }
      }
    }
    
    // Verificar user_profiles
    console.log('👤 Verificando user_profiles...')
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, preferences')
      .not('preferences', 'is', null)
      .limit(10)
    
    if (userError) {
      console.error('❌ Erro ao consultar user_profiles:', userError)
    } else {
      console.log(`✅ Encontrados ${users?.length || 0} perfis de usuários`)
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:')
    console.log(`🔍 Problemas encontrados: ${issues.length}`)
    
    if (issues.length > 0) {
      console.log('\n🚨 Problemas detectados:')
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.table}.${issue.field} (ID: ${issue.id}) - ${issue.issue}`)
      })
    } else {
      console.log('✅ Nenhum problema detectado!')
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error)
  }
}

simpleHealthCheck().catch(console.error)