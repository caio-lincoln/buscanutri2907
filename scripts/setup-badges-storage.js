const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupBadgesStorage() {
  try {
    console.log('🔍 Verificando buckets existentes...')
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError)
      return
    }
    
    console.log('📦 Buckets existentes:', buckets.map(b => b.name))
    
    // Verificar se o bucket 'badges' já existe
    const badgesBucket = buckets.find(bucket => bucket.name === 'badges')
    
    if (badgesBucket) {
      console.log('✅ Bucket "badges" já existe')
    } else {
      console.log('🆕 Criando bucket "badges"...')
      
      // Criar bucket para insígnias
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('badges', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
        fileSizeLimit: 1024 * 1024 * 2 // 2MB
      })
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError)
        return
      }
      
      console.log('✅ Bucket "badges" criado com sucesso')
    }
    
    // Verificar políticas RLS do bucket
    console.log('🔐 Verificando políticas de acesso...')
    
    try {
      // Criar política para permitir leitura pública
      await supabase.rpc('create_storage_policy', {
        bucket_name: 'badges',
        policy_name: 'Public read access',
        definition: 'true',
        operation: 'SELECT'
      })
    } catch (policyError) {
      // Política pode já existir, ignorar erro
      console.log('ℹ️ Política de leitura pública pode já existir')
    }
    
    console.log('🎉 Configuração do Storage para insígnias concluída!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

setupBadgesStorage()