'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Eye, 
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Tag,
  Globe,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { toast } from "sonner"
import { BlogPostsService } from '@/lib/blog-posts-service'
import { BlogPost } from '@/lib/supabase'

export default function VisualizarPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const { data, error } = await BlogPostsService.getPostById(postId)
      
      if (error) {
        toast.error('Erro ao carregar post: ' + error.message)
        router.push('/dashboard/nutricionistas/posts')
        return
      }

      if (!data) {
        toast.error('Post não encontrado')
        router.push('/dashboard/nutricionistas/posts')
        return
      }

      setPost(data)
      
      // Incrementar visualizações
      await BlogPostsService.incrementViews(postId)
    } catch (error) {
      console.error('Erro ao carregar post:', error)
      toast.error('Erro ao carregar post')
      router.push('/dashboard/nutricionistas/posts')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!post) return

    const shareData = {
      title: post.title,
      text: post.excerpt || post.content.substring(0, 150) + '...',
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        await BlogPostsService.incrementShares(post.id)
        toast.success('Post compartilhado!')
      } else {
        // Fallback para navegadores que não suportam Web Share API
        await navigator.clipboard.writeText(window.location.href)
        await BlogPostsService.incrementShares(post.id)
        toast.success('Link copiado para a área de transferência!')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast.error('Erro ao compartilhar post')
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      await BlogPostsService.incrementLikes(post.id)
      setPost(prev => prev ? {
        ...prev,
        likes_count: (prev.likes_count || 0) + 1
      } : null)
      toast.success('Post curtido!')
    } catch (error) {
      console.error('Erro ao curtir post:', error)
      toast.error('Erro ao curtir post')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      published: { label: 'Publicado', variant: 'default' as const },
      scheduled: { label: 'Agendado', variant: 'outline' as const }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatContent = (content: string) => {
    // Converter quebras de linha em parágrafos
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph.trim()}
      </p>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando post...
          </p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#1E1D40]/70 font-medium">
            Post não encontrado
          </p>
          <Button onClick={() => router.push('/dashboard/nutricionistas/posts')}>
            Voltar aos Posts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/nutricionistas/posts')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Posts
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/nutricionistas/posts/${post.id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            {post.status === 'published' && (
              <Button
                variant="outline"
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Público
              </Button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="space-y-6">
          {/* Header do Post */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge {...getStatusBadge(post.status)}>
                  {getStatusBadge(post.status).label}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likes_count || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count || 0}
                  </div>
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-[#1E1D40] leading-tight">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="text-xl text-gray-600 mt-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Você</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {post.published_at 
                      ? `Publicado em ${formatDate(post.published_at)}`
                      : `Criado em ${formatDate(post.created_at)}`
                    }
                  </span>
                </div>
                {post.read_time_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.read_time_minutes} min de leitura</span>
                  </div>
                )}
              </div>

              {/* Categoria e Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {post.category && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {post.category}
                  </Badge>
                )}
                {post.tags && post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>

          {/* Imagem Destacada */}
          {post.featured_image_url && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </Card>
          )}

          {/* Conteúdo */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-800 text-lg leading-relaxed">
                  {formatContent(post.content)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleLike}
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Curtir ({post.likes_count || 0})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Última atualização: {formatDate(post.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadados SEO */}
          {(post.meta_title || post.meta_description) && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Metadados SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.meta_title && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Título SEO</h4>
                    <p className="text-gray-600">{post.meta_title}</p>
                  </div>
                )}
                {post.meta_description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Descrição SEO</h4>
                    <p className="text-gray-600">{post.meta_description}</p>
                  </div>
                )}
                {post.slug && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Slug</h4>
                    <p className="text-gray-600 font-mono text-sm">{post.slug}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Informações do Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">ID</h4>
                  <p className="text-gray-600 font-mono">{post.id}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Status</h4>
                  <p className="text-gray-600">{getStatusBadge(post.status).label}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Visualizações</h4>
                  <p className="text-gray-600">{post.views || 0}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Engajamento</h4>
                  <p className="text-gray-600">
                    {(post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}