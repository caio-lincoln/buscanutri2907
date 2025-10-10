import { supabase } from './supabase'

export interface BlogPostViewStats {
  totalViews: number
  uniqueViews: number
  lastViewAt: string | null
}

export class BlogViewsService {
  private static isMissingColumnError(error: any, column: string) {
    const msg = (error && (error.message || error.error_description)) || ''
    const code = error && error.code
    return (
      code === 'PGRST204' &&
      msg.toLowerCase().includes(`'${column}'`) &&
      msg.toLowerCase().includes('schema cache')
    )
  }

  /**
   * Registra uma nova visualização para um blog post
   */
  static async recordView(
    blogPostId: string,
    viewerId?: string,
    viewerIp?: string,
    userAgent?: string
  ): Promise<BlogPostViewStats> {
    try {
      // Primeiro, tentar via RPC padronizada para evitar discrepâncias de colunas
      const { error: rpcError } = await supabase.rpc('increment_blog_post_views', {
        post_id_param: blogPostId,
        viewer_id_param: viewerId ?? null,
        viewer_ip_param: viewerIp ?? null,
        viewer_user_agent_param: userAgent ?? null,
      })

      if (rpcError) {
        // Fallback para inserção direta com adaptação dinâmica somente se função não estiver disponível
        const isMissingFunction = rpcError.code === 'PGRST202' ||
          ((rpcError.message || '').toLowerCase().includes('schema cache') && (rpcError.message || '').toLowerCase().includes('function'))

        if (!isMissingFunction) {
          throw rpcError
        }

        // Montar payload inicial usando nomenclatura mais comum
        const now = new Date().toISOString()
        let payload: Record<string, any> = {
          post_id: blogPostId,
          user_id: viewerId ?? null,
          viewed_at: now,
        }
        if (viewerIp) payload.ip_address = viewerIp
        if (userAgent) payload.user_agent = userAgent

        // Tentar inserir e, em caso de PGRST204 por coluna ausente, adaptar dinamicamente
        let { error: insertError } = await supabase.from('blog_post_views').insert(payload)

        // Loop de correção de colunas ausentes: ajusta um campo por iteração
        let safetyCounter = 0
        while (insertError && safetyCounter < 5) {
          safetyCounter++
          if (BlogViewsService.isMissingColumnError(insertError, 'post_id')) {
            // Alternar para blog_post_id
            payload.blog_post_id = payload.post_id
            delete payload.post_id
          } else if (BlogViewsService.isMissingColumnError(insertError, 'user_id')) {
            // Alternar para viewer_id; se viewerId não fornecido, remover
            if (payload.user_id) {
              payload.viewer_id = payload.user_id
            }
            delete payload.user_id
          } else if (BlogViewsService.isMissingColumnError(insertError, 'ip_address')) {
            // Alternar para viewer_ip
            if (payload.ip_address) {
              payload.viewer_ip = payload.ip_address
            }
            delete payload.ip_address
          } else if (BlogViewsService.isMissingColumnError(insertError, 'viewed_at')) {
            // Alternar para created_at
            payload.created_at = payload.viewed_at
            delete payload.viewed_at
          } else {
            // Erro não relacionado a colunas ausentes: sair do loop
            break
          }

          const res = await supabase.from('blog_post_views').insert(payload)
          insertError = res.error
        }

        if (insertError) throw insertError
      }

      // Após inserir, retornar estatísticas atualizadas
      const stats = await BlogViewsService.getViewStats(blogPostId)
      return stats
    } catch (error) {
      // Silent error handling: Error registering blog post view
      throw error
    }
  }

  /**
   * Obtém as estatísticas de visualização de um blog post
   */
  static async getViewStats(blogPostId: string): Promise<BlogPostViewStats> {
    try {
      // Primeiro tenta com post_id
      let { data, error } = await supabase
        .from('blog_post_views')
        .select('*')
        .eq('post_id', blogPostId)

      // Fallback para blog_post_id quando a coluna post_id não existe
      if (error && BlogViewsService.isMissingColumnError(error, 'post_id')) {
        const res = await supabase
          .from('blog_post_views')
          .select('*')
          .eq('blog_post_id', blogPostId)
        data = res.data
        error = res.error
      }

      if (error) {
        // Silent error handling: Error getting view statistics
        throw error
      }

      const safeData = (data || []).filter(v => !!v)
      const totalViews = safeData.length
      const idKey = safeData.length > 0 ? (('user_id' in safeData[0]) ? 'user_id' : (('viewer_id' in safeData[0]) ? 'viewer_id' : null)) : 'user_id'
      const uniqueViews = idKey
        ? new Set(safeData.map(view => view[idKey]).filter(Boolean)).size
        : totalViews
      const lastViewAt =
        safeData.length > 0
          ? (() => {
              const key = 'viewed_at' in safeData[0] ? 'viewed_at' : ('created_at' in safeData[0] ? 'created_at' : 'viewed_at')
              const sorted = safeData
                .slice()
                .filter(v => !!v[key])
                .sort((a, b) => {
                  const at = a[key] ? new Date(a[key]).getTime() : 0
                  const bt = b[key] ? new Date(b[key]).getTime() : 0
                  return bt - at
                })
              return sorted[0]?.[key] || null
            })()
          : null

      return {
        totalViews,
        uniqueViews,
        lastViewAt,
      }
    } catch (error) {
      // Silent error handling: Error getting view statistics
      return {
        totalViews: 0,
        uniqueViews: 0,
        lastViewAt: null,
      }
    }
  }

  /**
   * Obtém as estatísticas de visualização de múltiplos blog posts
   */
  static async getBulkViewStats(
    blogPostIds: string[]
  ): Promise<Record<string, BlogPostViewStats>> {
    try {
      // Tentar primeiro com post_id
      let { data, error } = await supabase
        .from('blog_post_views')
        .select('*')
        .in('post_id', blogPostIds)

      // Fallback para blog_post_id
      if (error && BlogViewsService.isMissingColumnError(error, 'post_id')) {
        const res = await supabase
          .from('blog_post_views')
          .select('*')
          .in('blog_post_id', blogPostIds)
        data = res.data
        error = res.error
      }

      if (error) {
        // Silent error handling: Error getting bulk statistics
        throw error
      }

      const stats: Record<string, BlogPostViewStats> = {}

      // Inicializar todos os posts com estatísticas zeradas
      blogPostIds.forEach(id => {
        stats[id] = {
          totalViews: 0,
          uniqueViews: 0,
          lastViewAt: null,
        }
      })

      // Processar dados de visualização
      if (data) {
        const idKey = (data[0] && 'post_id' in data[0]) ? 'post_id' : 'blog_post_id'
        const groupedByPost = data.reduce(
          (acc, view) => {
            const key = view[idKey]
            if (!acc[key]) {
              acc[key] = []
            }
            acc[key].push(view)
            return acc
          },
          {} as Record<string, typeof data>
        )

        Object.entries(groupedByPost).forEach(([postId, views]) => {
          const totalViews = views.length
          const idKey = views.length > 0 ? (('user_id' in views[0]) ? 'user_id' : (('viewer_id' in views[0]) ? 'viewer_id' : null)) : 'user_id'
          const uniqueViews = idKey
            ? new Set(views.map(v => v[idKey]).filter(Boolean)).size
            : totalViews
          const lastViewAt =
            views.length > 0
              ? (() => {
                  const key = 'viewed_at' in views[0] ? 'viewed_at' : ('created_at' in views[0] ? 'created_at' : 'viewed_at')
                  const sorted = views
                    .slice()
                    .filter(v => !!v[key])
                    .sort((a, b) => {
                      const at = a[key] ? new Date(a[key]).getTime() : 0
                      const bt = b[key] ? new Date(b[key]).getTime() : 0
                      return bt - at
                    })
                  return sorted[0]?.[key] || null
                })()
              : null

          stats[postId] = {
            totalViews,
            uniqueViews,
            lastViewAt,
          }
        })
      }

      return stats
    } catch (error) {
      // Silent error handling: Error getting bulk statistics
      return {}
    }
  }
}
