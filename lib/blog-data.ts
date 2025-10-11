import { v4 as uuidv4 } from 'uuid'
import { getNutritionistBadges, type NutritionistBadge } from './badge-service' // Importar o serviço de insígnias
import { createSupabaseClient } from './supabase'

// Criar cliente Supabase que mantém a sessão do usuário
const supabase = createSupabaseClient()

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  image: string // URL da imagem de capa
  author: string // Nome do autor
  authorId: string // ID do autor (para buscar insígnias)
  authorBio: string
  authorImage: string
  date: string // Formato YYYY-MM-DD
  category: string
  tags: string[]
  readTime: string // Ex: "5 min de leitura"
  views: number
  likes_count: number
  hasLiked: boolean
  featured: boolean
  centerImage?: boolean // Centralizar imagem de capa
  badges?: NutritionistBadge[] // Adicionar badges ao tipo
}

export const blogCategories = [
  'Alimentação Infantil',
  'Emagrecimento',
  'Receitas Saudáveis',
  'Nutrição Esportiva',
  'Saúde Digestiva',
  'Doenças Crônicas',
  'Vegetarianismo/Veganismo',
  'Bem-Estar',
]

// Função para buscar todos os posts do blog, incluindo as insígnias do autor
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `
      )
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching blog posts
      return []
    }

    const postsWithBadges = await Promise.all(
      (posts || []).map(async post => {
        const badges = await getNutritionistBadges(post.author_id)
        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content,
          image: post.image_url || '/placeholder.svg?height=400&width=800',
          author: post.nutritionist_profiles?.full_name || 'Autor Desconhecido',
          authorId: post.author_id,
          authorBio: post.nutritionist_profiles?.bio || '',
          authorImage:
            post.nutritionist_profiles?.profile_image_url ||
            '/placeholder.svg?height=100&width=100',
          date: new Date(post.created_at).toISOString().split('T')[0],
          category: post.category,
          tags: post.tags || [],
          readTime: `${
            typeof post.read_time_minutes === 'number'
              ? post.read_time_minutes
              : typeof post.read_time === 'number'
              ? post.read_time
              : 5
          } min de leitura`,
          views: post.views || 0,
          likes_count: post.likes_count || 0,
          hasLiked: false,
          featured: post.featured || false,
          centerImage: post.center_image || false,
          badges: badges.map(nb => nb.badge),
        } as BlogPost
      })
    )

    return postsWithBadges
  } catch (error) {
    // Silent error handling: Error fetching blog posts
    return []
  }
}

// Função para buscar um post por ID, incluindo as insígnias do autor
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `
      )
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error || !post) {
      // Silent error handling: Error fetching blog post
      return null
    }

    // Verificar se usuário atual curtiu este post
    let hasLiked = false
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: likeRow } = await supabase
          .from('blog_post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle()
        hasLiked = !!likeRow
      }
    } catch (e) {
      hasLiked = false
    }

    const badges = await getNutritionistBadges(post.author_id)

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      image: post.image_url || '/placeholder.svg?height=400&width=800',
      author: post.nutritionist_profiles?.full_name || 'Autor Desconhecido',
      authorId: post.author_id,
      authorBio: post.nutritionist_profiles?.bio || '',
      authorImage:
        post.nutritionist_profiles?.profile_image_url ||
        '/placeholder.svg?height=100&width=100',
      date: new Date(post.created_at).toISOString().split('T')[0],
      category: post.category,
      tags: post.tags || [],
      readTime: `${
        typeof post.read_time_minutes === 'number'
          ? post.read_time_minutes
          : typeof post.read_time === 'number'
          ? post.read_time
          : 5
      } min de leitura`,
      views: post.views || 0,
      likes_count: post.likes_count || 0,
      hasLiked,
      featured: post.featured || false,
      centerImage: post.center_image || false,
      badges: badges.map(nb => nb.badge),
    } as BlogPost
  } catch (error) {
    // Silent error handling: Error fetching blog post
    return null
  }
}

// Função para buscar posts por autor, incluindo as insígnias do autor
export async function getBlogPostsByAuthor(
  authorId: string
): Promise<BlogPost[]> {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `
      )
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching posts by author
      return []
    }

    const postsWithBadges = await Promise.all(
      (posts || []).map(async post => {
        const badges = await getNutritionistBadges(post.author_id)
        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content,
          image: post.image_url || '/placeholder.svg?height=400&width=800',
          author: post.nutritionist_profiles?.full_name || 'Autor Desconhecido',
          authorId: post.author_id,
          authorBio: post.nutritionist_profiles?.bio || '',
          authorImage:
            post.nutritionist_profiles?.profile_image_url ||
            '/placeholder.svg?height=100&width=100',
          date: new Date(post.created_at).toISOString().split('T')[0],
          category: post.category,
          tags: post.tags || [],
          readTime: post.read_time || '5 min de leitura',
          views: post.views || 0,
          likes_count: post.likes_count || 0,
          hasLiked: false,
          featured: post.featured || false,
          centerImage: post.center_image || false,
          badges: badges.map(nb => nb.badge),
        } as BlogPost
      })
    )

    return postsWithBadges
  } catch (error) {
    // Silent error handling: Error fetching posts by author
    return []
  }
}

// Função para adicionar um novo post
export async function addBlogPost(
  newPostData: Omit<BlogPost, 'id' | 'date' | 'views' | 'badges'>
): Promise<BlogPost | null> {
  try {
    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Silent error handling: User not authenticated
      throw new Error('Usuário não autenticado')
    }

    // Silent logging: User authenticated and attempting to create post

    // Verificar se o usuário autenticado é o mesmo que está tentando criar o post
    if (user.id !== newPostData.authorId) {
      // Silent error handling: User not authorized to create post for another author
      throw new Error('Não autorizado')
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title: newPostData.title,
        excerpt: newPostData.excerpt,
        content: newPostData.content,
        image_url: newPostData.image,
        author_id: newPostData.authorId,
        category: newPostData.category,
        tags: newPostData.tags,
        // read_time_minutes calculado automaticamente por trigger
        featured: newPostData.featured,
        center_image: newPostData.centerImage || false,
        published: true,
      })
      .select()
      .single()

    if (error || !post) {
      // Silent error handling: Error adding post
      return null
    }

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      image: post.image_url || '/placeholder.svg?height=400&width=800',
      author: newPostData.author,
      authorId: post.author_id,
      authorBio: newPostData.authorBio,
      authorImage: newPostData.authorImage,
      date: new Date(post.created_at).toISOString().split('T')[0],
      category: post.category,
      tags: post.tags || [],
      readTime: `${
        typeof post.read_time_minutes === 'number'
          ? post.read_time_minutes
          : typeof post.read_time === 'number'
          ? post.read_time
          : 5
      } min de leitura`,
      views: 0,
      likes_count: 0,
      hasLiked: false,
      featured: post.featured || false,
      centerImage: post.center_image || false,
      badges: [],
    } as BlogPost
  } catch (error) {
    // Silent error handling: Error adding post
    return null
  }
}

// Função para atualizar um post existente
export async function updateBlogPost(
  updatedPost: BlogPost
): Promise<BlogPost | null> {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({
        title: updatedPost.title,
        excerpt: updatedPost.excerpt,
        content: updatedPost.content,
        image_url: updatedPost.image,
        category: updatedPost.category,
        tags: updatedPost.tags,
        // read_time_minutes calculado automaticamente por trigger
        featured: updatedPost.featured,
        center_image: updatedPost.centerImage || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedPost.id)
      .select()
      .single()

    if (error || !post) {
      // Silent error handling: Error updating post
      return null
    }

    return {
      ...updatedPost,
      date: new Date(post.updated_at || post.created_at)
        .toISOString()
        .split('T')[0],
      likes_count:
        typeof updatedPost.likes_count === 'number'
          ? updatedPost.likes_count
          : post.likes_count || 0,
      hasLiked: typeof updatedPost.hasLiked === 'boolean' ? updatedPost.hasLiked : false,
    }
  } catch (error) {
    // Silent error handling: Error updating post
    return null
  }
}

// Função para deletar um post
export async function deleteBlogPost(
  id: string,
  authenticatedSupabase?: any
): Promise<boolean> {
  // Silent logging: Starting deleteBlogPost for ID

  try {
    // Usar o cliente autenticado se fornecido, senão usar o padrão
    const clientToUse = authenticatedSupabase || supabase

    // Verificar se o usuário está autenticado
    // Silent logging: Checking authentication
    const {
      data: { user },
      error: authError,
    } = await clientToUse.auth.getUser()

    if (authError || !user) {
      // Silent error handling: User not authenticated
      return false
    }

    // Silent logging: User authenticated

    // Primeiro, verificar se o post existe e se o usuário é o autor
    // Silent logging: Searching post to verify authorization
    const { data: post, error: fetchError } = await clientToUse
      .from('blog_posts')
      .select('author_id, title')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      // Silent error handling: Post not found
      return false
    }

    // Silent logging: Post found

    // Verificar se o usuário autenticado é o autor do post
    if (post.author_id !== user.id) {
      // Silent error handling: User not authorized to delete this post
      return false
    }

    // Silent logging: Authorization confirmed, proceeding with deletion

    // Deletar o post
    // Silent logging: Executing DELETE on Supabase
    const { data: deletedData, error } = await clientToUse
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id) // Dupla verificação de segurança
      .select() // Retorna os dados deletados

    if (error) {
      // Silent error handling: Error deleting post
      return false
    }

    // Silent logging: DELETE response

    if (!deletedData || deletedData.length === 0) {
      // Silent error handling: No record was deleted, possible RLS or condition issue
      return false
    }

    // Silent logging: Post deleted successfully
    return true
  } catch (error) {
    // Silent error handling: Unexpected error deleting post
    return false
  }
}
