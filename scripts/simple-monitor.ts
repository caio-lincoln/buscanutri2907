import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const out = (s: string) => process.stdout.write(`${s}\n`)
const err = (s: string) => process.stderr.write(`${s}\n`)

async function simpleHealthCheck() {
  out('🔍 Executando verificação simples de saúde dos dados...')

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? ''
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
  if (!url || !key) {
    throw new Error('Supabase env vars missing')
  }
  const supabase = createClient(url, key)

  interface Issue { table: string; field: string; id: string; issue: string }
  const issues: Issue[] = []

  try {
    // Verificar nutritionist_profiles
    out('📋 Verificando nutritionist_profiles...')
    const { data: nutritionists, error: nutError } = await supabase
      .from('nutritionist_profiles')
      .select('id, specialties, languages')
      .not('specialties', 'is', null)
      .limit(10)

    if (nutError) {
      err(`❌ Erro ao consultar nutritionist_profiles: ${String(nutError)}`)
    } else {
      out(`✅ Encontrados ${nutritionists?.length || 0} perfis de nutricionistas`)

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
                issue: 'JSON válido mas não é array',
              })
            }
          } catch {
            // Não é JSON válido - pode ser string simples ou dados corrompidos
            if (
              trimmed.includes(',') ||
              trimmed.includes('[') ||
              trimmed.includes('{')
            ) {
              // Parece ser dados estruturados mal formatados
              issues.push({
                table: 'nutritionist_profiles',
                field: 'specialties',
                id: profile.id,
                issue: 'Dados estruturados mal formatados',
              })
            } else if (trimmed.length > 100) {
              // String muito longa pode ser dados corrompidos
              issues.push({
                table: 'nutritionist_profiles',
                field: 'specialties',
                id: profile.id,
                issue: 'String muito longa (possível corrupção)',
              })
            }
            // Strings simples e curtas são OK
          }
        }
      }
    }

    // Verificar user_profiles
    out('👤 Verificando user_profiles...')
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, preferences')
      .not('preferences', 'is', null)
      .limit(10)

    if (userError) {
      err(`❌ Erro ao consultar user_profiles: ${String(userError)}`)
    } else {
      out(`✅ Encontrados ${users?.length || 0} perfis de usuários`)
    }

    // Relatório final
    out('\n📊 RELATÓRIO FINAL:')
    out(`🔍 Problemas encontrados: ${issues.length}`)

    if (issues.length > 0) {
      out('\n🚨 Problemas detectados:')
      issues.forEach((issue, index) => {
        out(`  ${index + 1}. ${issue.table}.${issue.field} (ID: ${issue.id}) - ${issue.issue}`)
      })
    } else {
      out('✅ Nenhum problema detectado!')
    }
  } catch (error) {
    err(`❌ Erro durante verificação: ${String(error)}`)
  }
}

simpleHealthCheck().catch(e => err(String(e)))
