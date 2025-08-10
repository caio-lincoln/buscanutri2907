const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const connectionString = process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  console.error('❌ POSTGRES_URL_NON_POOLING não encontrada no .env.local')
  console.error('Certifique-se de que a variável está definida em .env.local')
  process.exit(1)
}

async function addCancellationPolicyColumn() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
  })

  try {
    console.log('🚀 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado com sucesso!')

    console.log('📝 Verificando se a coluna cancellation_policy já existe...')

    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'nutritionist_profiles' 
      AND column_name = 'cancellation_policy'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('✅ A coluna cancellation_policy já existe!')
      return
    }

    console.log('📝 Adicionando coluna cancellation_policy...')

    // Adicionar a coluna
    await client.query(`
      ALTER TABLE public.nutritionist_profiles 
      ADD COLUMN cancellation_policy TEXT;
    `)

    console.log('📝 Adicionando comentário à coluna...')

    // Adicionar comentário
    await client.query(`
      COMMENT ON COLUMN public.nutritionist_profiles.cancellation_policy 
      IS 'Política de cancelamento de consultas definida pelo nutricionista';
    `)

    console.log('✅ Coluna cancellation_policy adicionada com sucesso!')

    // Verificar se a coluna foi adicionada
    const verifyColumn = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'nutritionist_profiles' 
      AND column_name = 'cancellation_policy'
    `)

    if (verifyColumn.rows.length > 0) {
      console.log('🎉 Verificação concluída:')
      console.log(`  - Coluna: ${verifyColumn.rows[0].column_name}`)
      console.log(`  - Tipo: ${verifyColumn.rows[0].data_type}`)
      console.log(`  - Permite NULL: ${verifyColumn.rows[0].is_nullable}`)
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message)

    if (error.message.includes('already exists')) {
      console.log('✅ A coluna já existe no banco de dados!')
    } else {
      console.log('📋 Execute este SQL manualmente no dashboard do Supabase:')
      console.log(
        'ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;'
      )
      process.exit(1)
    }
  } finally {
    await client.end()
    console.log('🔌 Conexão fechada')
  }
}

addCancellationPolicyColumn()
