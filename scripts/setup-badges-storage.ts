import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const out = (s: string) => process.stdout.write(`${s}\n`)
const err = (s: string) => process.stderr.write(`${s}\n`)

async function setupBadgesStorage(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente do Supabase não encontradas')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    out('🔍 Verificando buckets existentes...')

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      err(`❌ Erro ao listar buckets: ${String(listError)}`)
      return
    }

    out(`📦 Buckets existentes: ${(buckets || []).map(b => b.name).join(', ')}`)

    const badgesBucket = (buckets || []).find(bucket => bucket.name === 'badges')
    if (badgesBucket) {
      out('✅ Bucket "badges" já existe')
    } else {
      out('🆕 Criando bucket "badges"...')
      const { error: createError } = await supabase.storage.createBucket('badges', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
        fileSizeLimit: 1024 * 1024 * 2,
      })
      if (createError) {
        err(`❌ Erro ao criar bucket: ${String(createError)}`)
        return
      }
      out('✅ Bucket "badges" criado com sucesso')
    }

    out('🔐 Verificando políticas de acesso...')
    try {
      await supabase.rpc('create_storage_policy', {
        bucket_name: 'badges',
        policy_name: 'Public read access',
        definition: 'true',
        operation: 'SELECT',
      })
    } catch {
      out('ℹ️ Política de leitura pública pode já existir')
    }

    out('🎉 Configuração do Storage para insígnias concluída!')
  } catch (error) {
    err(`❌ Erro geral: ${String(error)}`)
    process.exitCode = 1
  }
}

setupBadgesStorage()
