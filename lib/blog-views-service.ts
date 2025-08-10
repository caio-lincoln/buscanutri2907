import { supabase } from './supabase'

export interface BlogPostViewStats {
  totalViews: number
  uniqueViews: number
  lastViewAt: string | null
}

export class BlogViewsService {
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
      const { data, error } = await supabase.rpc('increment_blog_post_views', {
        post_id: blogPostId,
        viewer_user_id: viewerId || null,
        viewer_ip_address: viewerIp || null,
        viewer_user_agent: userAgent || null,
      })

      if (error) {
        // Silent error handling: Error registering blog post view
        throw error
      }

      return {
        totalViews: data.total_views || 0,
        uniqueViews: data.unique_views || 0,
        lastViewAt: data.last_view_at || null,
      }
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
      const { data, error } = await supabase
        .from('blog_post_views')
        .select('*')
        .eq('blog_post_id', blogPostId)

      if (error) {
        // Silent error handling: Error getting view statistics
        throw error
      }

      const totalViews = data?.length || 0
      const uniqueViews = new Set(
        data?.map(view => view.viewer_id).filter(Boolean)
      ).size
      const lastViewAt =
        data?.length > 0
          ? data.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0].created_at
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
      const { data, error } = await supabase
        .from('blog_post_views')
        .select('blog_post_id, viewer_id, created_at')
        .in('blog_post_id', blogPostIds)

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
        const groupedByPost = data.reduce(
          (acc, view) => {
            if (!acc[view.blog_post_id]) {
              acc[view.blog_post_id] = []
            }
            acc[view.blog_post_id].push(view)
            return acc
          },
          {} as Record<string, typeof data>
        )

        Object.entries(groupedByPost).forEach(([postId, views]) => {
          const totalViews = views.length
          const uniqueViews = new Set(
            views.map(v => v.viewer_id).filter(Boolean)
          ).size
          const lastViewAt =
            views.length > 0
              ? views.sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0].created_at
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
