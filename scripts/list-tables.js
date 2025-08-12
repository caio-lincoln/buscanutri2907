const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  console.log('📋 Listando tabelas do banco de dados...\n')

  try {
    // Listar todas as tabelas
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      })

    if (error) {
      console.error('❌ Erro ao listar tabelas:', error)
      
      // Tentar método alternativo
      console.log('\n🔄 Tentando método alternativo...')
      
      const { data: altData, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      if (altError) {
        console.error('❌ Erro no método alternativo:', altError)
      } else {
        console.log('✅ Tabelas encontradas:')
        altData.forEach((table, index) => {
          console.log(`${index + 1}. ${table.table_name}`)
        })
      }
    } else {
      console.log('✅ Tabelas encontradas:')
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`)
      })
    }

    // Verificar especificamente as tabelas de blog
    console.log('\n🔍 Verificando tabelas específicas do blog...')
    
    const tablesToCheck = [
      'blog_posts',
      'blog_categories', 
      'blog_tags',
      'blog_post_comments',
      'blog_post_likes',
      'blog_post_views',
      'blog_post_shares',
      'nutritionists'
    ]

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: Existe`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

listTables()