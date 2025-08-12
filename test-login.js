// Script de teste para verificar login e autenticação
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lutokoucdfhfbwtppzwe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dG9rb3VjZGZoZmJ3dHBwendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDYwMjYsImV4cCI6MjA2NDQyMjAyNn0.C0t-drBeP3wCtt8X1xPa9hueWyh_bzup8xoeVzhIxto'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simular a função getMyPostsStats do BlogPostsService
async function getMyPostsStats() {
  try {
    console.log('Verificando autenticação para estatísticas...')
    
    // Primeiro verificar se há uma sessão ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError)
      return { data: null, error: { message: 'Erro ao verificar sessão: ' + sessionError.message } }
    }
    
    if (!session) {
      console.error('Nenhuma sessão ativa encontrada')
      return { data: null, error: { message: 'Nenhuma sessão ativa encontrada' } }
    }
    
    console.log('Sessão ativa encontrada, obtendo usuário...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError)
      return { data: null, error: { message: 'Erro ao obter usuário: ' + userError.message } }
    }
    
    if (!user) {
      console.error('Usuário não encontrado')
      return { data: null, error: { message: 'Usuário não autenticado' } }
    }
    
    console.log('Usuário autenticado:', user.id)

    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, published, views')
      .eq('author_id', user.id)

    if (error) {
      console.error('Erro ao buscar posts:', error)
      return { data: null, error }
    }

    // Buscar estatísticas de curtidas
    const { data: likesData } = await supabase
      .from('blog_post_likes')
      .select('post_id')
      .in('post_id', data.map(p => p.id) || [])

    // Buscar estatísticas de comentários
    const { data: commentsData } = await supabase
      .from('blog_post_comments')
      .select('post_id')
      .in('post_id', data.map(p => p.id) || [])

    // Buscar estatísticas de compartilhamentos
    const { data: sharesData } = await supabase
      .from('blog_post_shares')
      .select('post_id')
      .in('post_id', data.map(p => p.id) || [])

    const stats = {
      total_posts: data.length,
      published_posts: data.filter(p => p.published === true).length,
      draft_posts: data.filter(p => p.published === false).length,
      scheduled_posts: 0,
      total_views: data.reduce((sum, p) => sum + (p.views || 0), 0),
      total_likes: likesData?.length || 0,
      total_comments: commentsData?.length || 0,
      total_shares: sharesData?.length || 0
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return { data: null, error }
  }
}

async function testCompleteFlow() {
  try {
    console.log('🔍 Testando fluxo completo...')
    
    // 1. Tentar fazer login
    console.log('\n1. Fazendo login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste.nutricionista@buscanutri.com',
      password: '123456'
    })
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message)
      return
    }
    
    console.log('✅ Login realizado com sucesso!')
    console.log('👤 Usuário:', loginData.user.email)
    console.log('🔑 Sessão:', loginData.session ? 'Ativa' : 'Inativa')
    
    // 2. Verificar dados do usuário na tabela users
    console.log('\n2. Verificando dados do usuário...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message)
    } else {
      console.log('📊 Dados do usuário:', userData)
    }
    
    // 3. Testar a função getMyPostsStats
    console.log('\n3. Testando getMyPostsStats...')
    const statsResult = await getMyPostsStats()
    
    if (statsResult.error) {
      console.error('❌ Erro nas estatísticas:', statsResult.error)
    } else {
      console.log('✅ Estatísticas obtidas com sucesso:', statsResult.data)
    }
    
    // 4. Criar um post de teste para o usuário
    console.log('\n4. Criando post de teste...')
    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: 'Post de Teste - ' + new Date().toISOString(),
        content: 'Este é um post de teste criado automaticamente.',
        excerpt: 'Post de teste',
        category: 'Nutrição Geral',
        author_id: loginData.user.id,
        published: true,
        views: 5
      })
      .select()
      .single()
    
    if (postError) {
      console.error('❌ Erro ao criar post:', postError.message)
    } else {
      console.log('✅ Post criado:', newPost.title)
      
      // 5. Testar estatísticas novamente
      console.log('\n5. Testando estatísticas após criar post...')
      const newStatsResult = await getMyPostsStats()
      
      if (newStatsResult.error) {
        console.error('❌ Erro nas novas estatísticas:', newStatsResult.error)
      } else {
        console.log('✅ Novas estatísticas:', newStatsResult.data)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testCompleteFlow()