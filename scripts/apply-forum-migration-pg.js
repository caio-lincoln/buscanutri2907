const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const connectionString = process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  console.error('❌ POSTGRES_URL_NON_POOLING não encontrada no .env.local')
  process.exit(1)
}

async function applyForumMigration() {
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

    console.log('📝 Aplicando migração das tabelas do fórum...')

    // Ler o arquivo de migração
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250125000002_create_forum_tables.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Executar a migração completa
    await client.query(migrationSQL)

    console.log('✅ Migração das tabelas do fórum aplicada com sucesso!')

    // Verificar se as tabelas foram criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'forum_%'
      ORDER BY table_name
    `)

    console.log('📋 Tabelas do fórum criadas:')
    result.rows.forEach(row => console.log(`  - ${row.table_name}`))
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyForumMigration()
