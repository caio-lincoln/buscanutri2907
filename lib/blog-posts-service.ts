import { supabase } from './supabase'
import { BlogPost } from './supabase'

export interface CreateBlogPostData {
  title: string
  content: string
  excerpt?: string
  category?: string
  tags?: string[]
  status?: 'draft' | 'published' | 'scheduled'
  featured_image_url?: string
  published_at?: string
  scheduled_for?: string
  meta_title?: string
  meta_description?: string
  slug?: string
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string
}

export interface BlogPostFilters {
  status?: 'draft' | 'published' | 'scheduled'
  category?: string
  tags?: string[]
  author_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface BlogPostStats {
  total_posts: number
  published_posts: number
  draft_posts: number
  scheduled_posts: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
}

export class BlogPostsService {
  // Criar um novo post
  static async createPost(postData: CreateBlogPostData): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } }
      }

      // Se for para publicar, definir como published
      if (postData.status === 'published') {
        postData.published = true
      } else {
        postData.published = false
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          ...postData,
          author_id: user.id
        })
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao criar post:', error)
      return { data: null, error }
    }
  }

  // Atualizar um post existente
  static async updatePost(updateData: UpdateBlogPostData): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { id, ...postData } = updateData

      // Se mudando para 'published', definir como published
      if (postData.status === 'published') {
        postData.published = true
      } else if (postData.status === 'draft') {
        postData.published = false
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao atualizar post:', error)
      return { data: null, error }
    }
  }

  // Deletar um post
  static async deletePost(postId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      return { error }
    } catch (error) {
      console.error('Erro ao deletar post:', error)
      return { error }
    }
  }

  // Buscar posts com filtros e paginação
  static async getPosts(
    filters: BlogPostFilters = {},
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: BlogPost[] | null; error: any; count: number | null }> {
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.status) {
        if (filters.status === 'published') {
          query = query.eq('published', true)
        } else if (filters.status === 'draft') {
          query = query.eq('published', false)
        }
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Ordenação e paginação
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      const { data, error, count } = await query

      return { data, error, count }
    } catch (error) {
      console.error('Erro ao buscar posts:', error)
      return { data: null, error, count: null }
    }
  }

  // Buscar posts do usuário logado
  static async getMyPosts(
    filters: Omit<BlogPostFilters, 'author_id'> = {},
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: BlogPost[] | null; error: any; count: number | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' }, count: null }
      }

      return this.getPosts(
        { ...filters, author_id: user.id },
        page,
        limit,
        orderBy,
        orderDirection
      )
    } catch (error) {
      console.error('Erro ao buscar meus posts:', error)
      return { data: null, error, count: null }
    }
  }

  // Buscar um post específico por ID
  static async getPostById(postId: string): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `)
        .eq('id', postId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao buscar post:', error)
      return { data: null, error }
    }
  }

  // Buscar post por slug
  static async getPostBySlug(slug: string): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao buscar post por slug:', error)
      return { data: null, error }
    }
  }

  // Incrementar visualizações
  static async incrementViews(postId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ views: supabase.sql`views + 1` })
        .eq('id', postId)

      return { error }
    } catch (error) {
      console.error('Erro ao incrementar visualizações:', error)
      return { error }
    }
  }

  // Incrementar curtidas
  static async incrementLikes(postId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: { message: 'Usuário não autenticado' } }
      }

      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('blog_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        return { error: { message: 'Post já foi curtido' } }
      }

      const { error } = await supabase
        .from('blog_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      return { error }
    } catch (error) {
      console.error('Erro ao incrementar curtidas:', error)
      return { error }
    }
  }

  // Decrementar curtidas
  static async decrementLikes(postId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: { message: 'Usuário não autenticado' } }
      }

      const { error } = await supabase
        .from('blog_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      return { error }
    } catch (error) {
      console.error('Erro ao decrementar curtidas:', error)
      return { error }
    }
  }

  // Incrementar compartilhamentos
  static async incrementShares(postId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: { message: 'Usuário não autenticado' } }
      }

      const { error } = await supabase
        .from('blog_post_shares')
        .insert({
          post_id: postId,
          user_id: user.id,
          shared_at: new Date().toISOString()
        })

      return { error }
    } catch (error) {
      console.error('Erro ao incrementar compartilhamentos:', error)
      return { error }
    }
  }

  // Obter estatísticas dos posts do usuário
  static async getMyPostsStats(): Promise<{ data: BlogPostStats | null; error: any }> {
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

      const stats: BlogPostStats = {
        total_posts: data.length,
        published_posts: data.filter(p => p.published === true).length,
        draft_posts: data.filter(p => p.published === false).length,
        scheduled_posts: 0, // Não temos campo de agendamento ainda
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

  // Buscar categorias disponíveis
  static async getCategories(): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .not('category', 'is', null)
        .neq('category', '')

      if (error) {
        return { data: null, error }
      }

      const categories = [...new Set(data.map(item => item.category).filter(Boolean))]
      return { data: categories, error: null }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      return { data: null, error }
    }
  }

  // Buscar tags populares
  static async getPopularTags(limit: number = 20): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('tags')
        .not('tags', 'is', null)

      if (error) {
        return { data: null, error }
      }

      const tagCounts: { [key: string]: number } = {}
      
      data.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag]) => tag)

      return { data: popularTags, error: null }
    } catch (error) {
      console.error('Erro ao buscar tags populares:', error)
      return { data: null, error }
    }
  }

  // Publicar post agendado
  static async publishScheduledPost(postId: string): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('published', false)
        .select(`
          *,
          nutritionist_profiles!blog_posts_author_id_fkey (
            user_id,
            full_name,
            profile_image_url,
            specialties
          )
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Erro ao publicar post agendado:', error)
      return { data: null, error }
    }
  }

  // Duplicar post
  static async duplicatePost(postId: string): Promise<{ data: BlogPost | null; error: any }> {
    try {
      const { data: originalPost, error: fetchError } = await this.getPostById(postId)
      
      if (fetchError || !originalPost) {
        return { data: null, error: fetchError || { message: 'Post não encontrado' } }
      }

      const duplicateData: CreateBlogPostData = {
        title: `${originalPost.title} (Cópia)`,
        content: originalPost.content,
        excerpt: originalPost.excerpt,
        category: originalPost.category,
        tags: originalPost.tags,
        status: 'draft',
        featured_image_url: originalPost.featured_image_url,
        meta_title: originalPost.meta_title,
        meta_description: originalPost.meta_description
      }

      return this.createPost(duplicateData)
    } catch (error) {
      console.error('Erro ao duplicar post:', error)
      return { data: null, error }
    }
  }
}
