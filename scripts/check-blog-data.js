const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBlogData() {
  console.log('🔍 Verificando dados do blog...\n')

  try {
    // Verificar posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(10)

    if (postsError) {
      console.error('❌ Erro ao buscar posts:', postsError)
    } else {
      console.log(`📝 Posts encontrados: ${posts.length}`)
      if (posts.length > 0) {
        console.log('\n📋 Primeiros posts:')
        posts.forEach((post, index) => {
          console.log(`${index + 1}. ${post.title} (${post.status})`)
          console.log(`   Categoria: ${post.category}`)
          console.log(`   Views: ${post.views || 0}, Likes: ${post.likes_count || 0}`)
          console.log(`   Criado em: ${new Date(post.created_at).toLocaleDateString('pt-BR')}`)
          console.log('')
        })
      }
    }

    // Verificar categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('blog_categories')
      .select('*')

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
    } else {
      console.log(`🏷️ Categorias encontradas: ${categories.length}`)
      if (categories.length > 0) {
        console.log('\n📂 Categorias:')
        categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name} (${cat.posts_count || 0} posts)`)
        })
      }
    }

    // Verificar comentários
    const { data: comments, error: commentsError } = await supabase
      .from('blog_post_comments')
      .select('*')
      .limit(5)

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError)
    } else {
      console.log(`\n💬 Comentários encontrados: ${comments.length}`)
    }

    // Verificar curtidas
    const { data: likes, error: likesError } = await supabase
      .from('blog_post_likes')
      .select('*')
      .limit(5)

    if (likesError) {
      console.error('❌ Erro ao buscar curtidas:', likesError)
    } else {
      console.log(`❤️ Curtidas encontradas: ${likes.length}`)
    }

    // Verificar visualizações
    const { data: views, error: viewsError } = await supabase
      .from('blog_post_views')
      .select('*')
      .limit(5)

    if (viewsError) {
      console.error('❌ Erro ao buscar visualizações:', viewsError)
    } else {
      console.log(`👁️ Visualizações encontradas: ${views.length}`)
    }

    // Verificar nutricionistas
    const { data: nutritionists, error: nutritionistsError } = await supabase
      .from('nutritionists')
      .select('id, full_name, email')
      .limit(5)

    if (nutritionistsError) {
      console.error('❌ Erro ao buscar nutricionistas:', nutritionistsError)
    } else {
      console.log(`\n👩‍⚕️ Nutricionistas encontrados: ${nutritionists.length}`)
      if (nutritionists.length > 0) {
        console.log('\n👥 Nutricionistas:')
        nutritionists.forEach((nut, index) => {
          console.log(`${index + 1}. ${nut.full_name} (${nut.email})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkBlogData()