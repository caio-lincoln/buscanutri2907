const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(migrationFile) {
  try {
    console.log(`📄 Aplicando migração: ${migrationFile}`)
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Dividir o SQL em comandos individuais (separados por ';')
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    for (const command of commands) {
      if (command.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          console.error(`❌ Erro ao executar comando SQL:`, error)
          console.log(`Comando: ${command.substring(0, 100)}...`)
        }
      }
    }
    
    console.log(`✅ Migração ${migrationFile} aplicada com sucesso`)
  } catch (error) {
    console.error(`❌ Erro ao aplicar migração ${migrationFile}:`, error)
    throw error
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    return !error
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação das migrações do blog...')
  
  try {
    // Verificar se a tabela blog_posts já existe
    const blogPostsExists = await checkTableExists('blog_posts')
    
    if (!blogPostsExists) {
      console.log('📋 Aplicando migração da tabela blog_posts...')
      await applyMigration('20250203000002_create_blog_posts_table.sql')
    } else {
      console.log('✅ Tabela blog_posts já existe')
    }
    
    // Verificar se as tabelas relacionadas existem
    const categoriesExists = await checkTableExists('blog_categories')
    
    if (!categoriesExists) {
      console.log('📋 Aplicando migração das tabelas relacionadas...')
      await applyMigration('20250203000003_create_blog_related_tables.sql')
    } else {
      console.log('✅ Tabelas relacionadas já existem')
    }
    
    // Verificar se existem dados de exemplo
    const { data: postsData } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1)
    
    if (!postsData || postsData.length === 0) {
      console.log('📋 Inserindo dados de exemplo...')
      await applyMigration('20250203000004_insert_sample_blog_data.sql')
    } else {
      console.log('✅ Dados de exemplo já existem')
    }
    
    console.log('🎉 Todas as migrações foram aplicadas com sucesso!')
    console.log('📊 Verificando dados inseridos...')
    
    // Verificar dados inseridos
    const { data: posts, count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
    
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('*')
    
    console.log(`📝 Posts criados: ${count}`)
    console.log(`🏷️ Categorias criadas: ${categories?.length || 0}`)
    
    if (posts && posts.length > 0) {
      console.log('\n📋 Primeiros posts criados:')
      posts.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} (${post.status})`)
      })
    }
    
    if (categories && categories.length > 0) {
      console.log('\n🏷️ Categorias disponíveis:')
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro durante a aplicação das migrações:', error)
    process.exit(1)
  }
}

// Executar o script
main()