'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  ArrowLeft,
  Search,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  Plus,
  Filter,
  TrendingUp,
  MoreVertical,
  MoreHorizontal,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { BlogPostsService, CreateBlogPostData, BlogPostStats } from '@/lib/blog-posts-service'
import { BlogPost, createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function PostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [stats, setStats] = useState<BlogPostStats>({
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    scheduled_posts: 0,
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0
  })
  const [categories, setCategories] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const itemsPerPage = 12

  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading, signOut } = useAuth()
  const profile = nutritionistProfile

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats } = useDashboardStats({
    userType: 'nutricionista',
    userId: profile?.user_id || '',
    enabled: !!profile?.user_id,
  })
  const supabase = createSupabaseClient()
  const menuItems = getMenuItems('nutricionista', dashboardStats)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (profile?.user_id) {
      loadPosts()
      loadStats()
      loadCategories()
    }
  }, [user, authLoading, profile?.user_id, currentPage, searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  const loadPosts = async () => {
    if (!profile?.user_id) return

    try {
      setLoading(true)
      
      const filters: any = {}
      
      if (filterStatus !== 'all') {
        filters.status = filterStatus
      }
      
      if (filterCategory !== 'all') {
        filters.category = filterCategory
      }
      
      if (searchTerm) {
        filters.search = searchTerm
      }

      const { data, error, count } = await BlogPostsService.getMyPosts(
        filters,
        currentPage,
        itemsPerPage,
        sortBy,
        sortOrder
      )

      if (error) {
        toast.error('Erro ao carregar posts: ' + error.message)
        return
      }

      setPosts(data || [])
      setTotalPosts(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
      toast.error('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data, error } = await BlogPostsService.getMyPostsStats(supabase)
      
      if (error) {
        console.error('Erro ao carregar estatísticas:', error)
        return
      }

      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await BlogPostsService.getCategories()
      
      if (error) {
        console.error('Erro ao carregar categorias:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const deletePost = async (postId: string) => {
    try {
      const { error } = await BlogPostsService.deletePost(postId)
      
      if (error) {
        toast.error('Erro ao excluir post: ' + error.message)
        return
      }

      toast.success('Post excluído com sucesso!')
      loadPosts()
      loadStats()
    } catch (error) {
      console.error('Erro ao excluir post:', error)
      toast.error('Erro ao excluir post')
    }
  }

  // Funções auxiliares para criar e duplicar posts
  const handleCreatePost = async (postData: CreateBlogPostData) => {
    try {
      const { data, error } = await BlogPostsService.createPost(postData)
      
      if (error) {
        toast.error('Erro ao criar post: ' + error.message)
        return
      }

      toast.success('Post criado com sucesso!')
      loadPosts()
      loadStats()
    } catch (error) {
      console.error('Erro ao criar post:', error)
      toast.error('Erro ao criar post')
    }
  }

  const handleDuplicatePost = async (postId: string) => {
    try {
      const { data, error } = await BlogPostsService.duplicatePost(postId)
      
      if (error) {
        toast.error('Erro ao duplicar post: ' + error.message)
        return
      }

      toast.success('Post duplicado com sucesso!')
      loadPosts()
      loadStats()
    } catch (error) {
      console.error('Erro ao duplicar post:', error)
      toast.error('Erro ao duplicar post')
    }
  }

  const handlePublishScheduledPost = async (postId: string) => {
    try {
      const { data, error } = await BlogPostsService.publishScheduledPost(postId)
      
      if (error) {
        toast.error('Erro ao publicar post: ' + error.message)
        return
      }

      toast.success('Post publicado com sucesso!')
      loadPosts()
      loadStats()
    } catch (error) {
      console.error('Erro ao publicar post:', error)
      toast.error('Erro ao publicar post')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado'
      case 'draft':
        return 'Rascunho'
      case 'scheduled':
        return 'Agendado'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não definido'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando posts...
          </p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={profile?.full_name || 'Nutricionista'}
      userAvatar={profile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem="posts"
      onItemClick={(itemId) => {
        if (itemId === 'overview') {
          router.push('/dashboard/nutricionistas')
        } else if (itemId === 'perfil' && profile?.id) {
          router.push(`/dashboard/nutricionistas/${profile.id}`)
        }
      }}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/nutricionistas')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">
                Meus Posts
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie seus artigos e conteúdos
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/dashboard/nutricionistas/posts/novo')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Posts</p>
                  <p className="text-2xl font-bold text-[#1E1D40]">
                    {stats.total_posts}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.published_posts}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Views</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.total_views.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Likes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.total_likes}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todos os status</option>
                  <option value="published">Publicados</option>
                  <option value="draft">Rascunhos</option>
                  <option value="scheduled">Agendados</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="created_at">Data de criação</option>
                  <option value="published_at">Data de publicação</option>
                  <option value="views">Mais visualizados</option>
                  <option value="title">Título (A-Z)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Posts */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Posts ({totalPosts})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(post.status)}
                        >
                          {getStatusText(post.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/nutricionistas/posts/${post.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/nutricionistas/posts/${post.id}/editar`)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicatePost(post.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            {post.status === 'scheduled' && (
                              <DropdownMenuItem
                                onClick={() => handlePublishScheduledPost(post.id)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Publicar Agora
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.share?.({
                                    title: post.title,
                                    text: post.excerpt,
                                    url: `${window.location.origin}/posts/${post.slug || post.id}`,
                                  })
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPost(post)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#1E1D40] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {post.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {post.read_time || '5 min'} de leitura
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.published_at || post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.views || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>0</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/nutricionistas/posts/${post.id}`)
                          }
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        {post.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Implementar compartilhamento
                              navigator.share?.({
                                title: post.title,
                                text: post.excerpt,
                                url: `/posts/${post.id}`,
                              })
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'Nenhum post encontrado'
                    : 'Nenhum post criado'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro post'}
                </p>
                {(!searchTerm && filterCategory === 'all' && filterStatus === 'all') && (
                  <Button
                    onClick={() => router.push('/dashboard/nutricionistas/posts/novo')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Post
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Diálogo de Confirmação de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o post "{selectedPost?.title}"? 
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setSelectedPost(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedPost) {
                    deletePost(selectedPost.id)
                    setShowDeleteDialog(false)
                    setSelectedPost(null)
                  }
                }}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardSidebar>
  )
}
