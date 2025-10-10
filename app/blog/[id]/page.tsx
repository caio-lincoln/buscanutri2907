'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ContentRenderer,
  useEmbedScripts,
} from '@/components/ui/content-renderer'
import {
  Calendar,
  Clock,
  Eye,
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Award,
} from 'lucide-react'
import { getBlogPostById, type BlogPost } from '@/lib/blog-data'
import { useRealtimeBlogViews } from '@/hooks/use-realtime-blog-views'
import { toast } from '@/components/ui/use-toast'
import Loading from '@/components/ui/loading'

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params['id'] as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const { stats, recordView } = useRealtimeBlogViews({
    blogPostId: postId,
  })

  const [loading, setLoading] = useState(true)

  useEmbedScripts()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      const fetchedPost = await getBlogPostById(postId)
      if (fetchedPost) {
        setPost(fetchedPost)
        // Registrar visualização
        recordView().catch(() => {})
      } else {
        toast({
          title: 'Artigo não encontrado',
          description: 'O artigo que você está procurando não existe.',
          variant: 'destructive',
        })
        router.push('/blog')
      }
      setLoading(false)
    }
    if (postId) {
      fetchPost()
    }
  }, [postId, router])

  if (loading) {
    return <Loading message="Carregando artigo..." />
  }

  if (!post) {
    return null // Ou um componente de erro/não encontrado
  }

  const shareUrl = `${process.env['NEXT_PUBLIC_BASE_URL']}/blog/${post.id}`
  const shareText = `Confira este artigo da Busca Nutri: ${post.title}`

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#1E1D40]"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o Blog
      </Button>

      <Card className="border-0 shadow-lg backdrop-blur-sm mb-8">
        <CardHeader className="p-0">
          <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-t-xl">
            <Image
              src={post.image || '/placeholder.svg?height=400&width=800'}
              alt={post.title}
              fill
              className={`object-cover ${
                post.centerImage ? 'mx-auto block' : ''
              }`}
              priority
            />
            <Badge
              variant="secondary"
              className="absolute top-4 left-4 bg-white/95 text-[#4AB0D9] backdrop-blur-sm text-sm px-3 py-1"
            >
              {post.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 lg:p-10 space-y-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E1D40] leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    post.authorImage ||
                    `/placeholder.svg?height=32&width=32&query=${post.author}`
                  }
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-semibold">
                  {post.author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-[#1E1D40]">
                {post.author}
              </span>
              {post.badges && post.badges.length > 0 && (
                <div className="flex items-center gap-1">
                  {post.badges.slice(0, 3).map((badge: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                    >
                      {badge.icon ? (
                        <img
                          src={badge.icon}
                          alt={badge.name}
                          className="w-4 h-4"
                        />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      <span>{badge.name}</span>
                    </div>
                  ))}
                  {post.badges.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{post.badges.length - 3} mais
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{(stats.totalViews || post.views || 0).toLocaleString()} visualizações</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            <ContentRenderer
              content={post.content}
              centerImages={post.centerImage || false}
            />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {post.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm px-3 py-1"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <span className="text-gray-600 text-sm">Compartilhe:</span>
            <Button variant="ghost" size="icon" asChild>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Facebook"
              >
                <Facebook className="h-5 w-5 text-gray-600 hover:text-blue-600" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Twitter"
              >
                <Twitter className="h-5 w-5 text-gray-600 hover:text-blue-400" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                  shareUrl
                )}&title=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-gray-600 hover:text-blue-700" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
