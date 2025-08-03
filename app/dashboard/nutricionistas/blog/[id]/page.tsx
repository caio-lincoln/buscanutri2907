"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { signOut } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getMenuItems } from "@/lib/dashboard-stats"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  BookOpen,
  User,
  Tag,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getBlogPostById, updateBlogPost, type BlogPost } from "@/lib/blog-data"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

export default function NutritionistBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [] as string[],
    image: "",
  })
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Dashboard stats
  const { stats, loading: statsLoading } = useDashboardStats(currentUserId, "nutricionista")
  const menuItems = getMenuItems("nutricionista", stats)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  useEffect(() => {
    loadPost()
    loadCurrentUser()
  }, [postId])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUserId(user?.id || null)
      setCurrentUser(user)
    } catch (error) {
      console.error("Erro ao carregar usuário:", error)
    }
  }

  const loadPost = async () => {
    try {
      setLoading(true)
      const postData = await getBlogPostById(postId)
      if (postData) {
        setPost(postData)
        setEditForm({
          title: postData.title,
          excerpt: postData.excerpt,
          content: postData.content,
          category: postData.category,
          tags: postData.tags,
          image: postData.image,
        })
      } else {
        toast({
          title: "Post não encontrado",
          description: "O artigo que você está procurando não foi encontrado.",
          variant: "destructive",
        })
        router.push("/dashboard/nutricionistas")
      }
    } catch (error) {
      console.error("Erro ao carregar post:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar o artigo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!post || !currentUserId) return

    // Verificar se o usuário atual é o autor do post
    if (post.authorId !== currentUserId) {
      toast({
        title: "Acesso negado",
        description: "Você só pode editar seus próprios artigos.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const updatedPost = await updateBlogPost({
        ...post,
        ...editForm,
      })
      setPost(updatedPost)
      setIsEditing(false)
      toast({
        title: "Sucesso",
        description: "Artigo atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao salvar post:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar o artigo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!post) return
    setEditForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      image: post.image,
    })
    setIsEditing(false)
  }

  const canEdit = post && currentUserId && post.authorId === currentUserId

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Carregando artigo...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-[#1E1D40]">Artigo não encontrado</h2>
          <p className="text-gray-600">O artigo que você está procurando não existe.</p>
          <Button onClick={() => router.push("/dashboard/nutricionistas")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={currentUser?.user_metadata?.full_name || "Nutricionista"}
      menuItems={menuItems}
      activeItem="blog"
      onItemClick={(item) => router.push(item.href)}
      onSignOut={handleSignOut}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/nutricionistas")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          {canEdit && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4" />
                  Editar Artigo
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Artigo */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {isEditing ? (
              <div className="space-y-6">
                {/* Título */}
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="text-2xl font-bold"
                  />
                </div>

                {/* Resumo */}
                <div>
                  <Label htmlFor="excerpt">Resumo</Label>
                  <Textarea
                    id="excerpt"
                    value={editForm.excerpt}
                    onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Categoria */}
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={editForm.tags.join(", ")}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) 
                    })}
                  />
                </div>

                {/* URL da Imagem */}
                <div>
                  <Label htmlFor="image">URL da Imagem</Label>
                  <Input
                    id="image"
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  />
                </div>

                {/* Conteúdo */}
                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Imagem de capa */}
                {post.image && (
                  <div className="w-full h-64 rounded-xl overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Título */}
                <h1 className="text-4xl font-bold text-[#1E1D40] leading-tight">
                  {post.title}
                </h1>

                {/* Meta informações */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.authorImage} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views} visualizações</span>
                  </div>
                </div>

                {/* Categoria e Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {post.category}
                  </Badge>
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-gray-600">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Resumo */}
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  {post.excerpt}
                </p>

                {/* Conteúdo */}
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {post.content}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                      <Heart className="h-4 w-4 mr-2" />
                      Curtir
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comentar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/blog")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Ver no Blog Público
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardSidebar>
  )
}