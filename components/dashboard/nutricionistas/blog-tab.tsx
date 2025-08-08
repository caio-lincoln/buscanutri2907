"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash, Calendar, Clock, User, Search, List, Grid, Award } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { AdvancedImageUpload } from "@/components/ui/advanced-image-upload"
import {
  type BlogPost,
  getBlogPostsByAuthor,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
  blogCategories,
} from "@/lib/blog-data" // Importar funções e categorias do blog-data
import { getCurrentUser } from "@/lib/auth" // Para obter o ID do usuário logado
import { createSupabaseClient } from "@/lib/supabase" // Para cliente autenticado

export function BlogTab() {
  const [myPosts, setMyPosts] = useState<BlogPost[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorId, setAuthorId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      setLoading(true)
      const user = await getCurrentUser()
      if (user) {
        setAuthorId(user.id)
        const posts = await getBlogPostsByAuthor(user.id)
        setMyPosts(posts)
      }
      setLoading(false)
    }
    fetchUserAndPosts()
  }, [])

  const filteredPosts = myPosts.filter((post) => {
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleNewPost = () => {
    setIsEditing(true)
    setCurrentPost({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      image: "/placeholder.svg?height=400&width=800",
      tags: [],
      featured: false,
    })
  }

  const handleEditPost = (post: BlogPost) => {
    setIsEditing(true)
    setCurrentPost({ ...post })
  }

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.")) {
      try {
        // Criar cliente Supabase autenticado
        const supabase = createSupabaseClient()
        const success = await deleteBlogPost(id, supabase)
        if (success) {
          // Refresh posts
          const posts = await getBlogPostsByAuthor(authorId || "")
          setMyPosts(posts)
          toast({ 
            title: "Artigo excluído", 
            description: "O artigo foi removido com sucesso." 
          })
        } else {
          toast({ 
            title: "Erro ao excluir", 
            description: "Não foi possível excluir o artigo. Verifique se você tem permissão para esta ação.", 
            variant: "destructive" 
          })
        }
      } catch (error) {
        console.error('Erro ao excluir post:', error)
        toast({ 
          title: "Erro inesperado", 
          description: "Ocorreu um erro inesperado ao tentar excluir o artigo. Tente novamente.", 
          variant: "destructive" 
        })
      }
    }
  }

  // Função para formatar o nome do autor
  const formatAuthorName = (fullName: string) => {
    const names = fullName.trim().split(' ')
    if (names.length === 1) {
      return names[0]
    }
    if (names.length === 2) {
      return `${names[0]} ${names[1][0]}.`
    }
    // Para nomes com mais de 2 partes, pega o primeiro nome e a primeira letra do segundo
    return `${names[0]} ${names[1][0]}.`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPost || !authorId) return

    if (!currentPost.title || !currentPost.content || !currentPost.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, conteúdo e categoria.",
        variant: "destructive",
      })
      return
    }

    const authorName = "Nutricionista Logado" // Placeholder, replace with actual user name
    const authorBio = "Nutricionista da Busca Nutri." // Placeholder, replace with actual user bio
    const authorImage = "/placeholder.svg?height=100&width=100" // Placeholder

    if (currentPost.id) {
      // Update existing post
      const updated = await updateBlogPost({
        ...currentPost,
        author: authorName,
        authorId: authorId,
        authorBio: authorBio,
        authorImage: authorImage,
        readTime: currentPost.readTime || "5 min", // Default if not set
        views: currentPost.views || 0, // Default if not set
        date: currentPost.date || new Date().toISOString().split("T")[0], // Default if not set
      } as BlogPost)
      if (updated) {
        toast({ title: "Artigo atualizado", description: "O artigo foi salvo com sucesso." })
      } else {
        toast({ title: "Erro", description: "Não foi possível atualizar o artigo.", variant: "destructive" })
      }
    } else {
      // Add new post
      const newPost = await addBlogPost({
        ...currentPost,
        author: authorName,
        authorId: authorId,
        authorBio: authorBio,
        authorImage: authorImage,
        readTime: "5 min", // Default read time for new posts
        views: 0, // New posts start with 0 views
      } as Omit<BlogPost, "id" | "date" | "views" | "badges">)
      if (newPost) {
        toast({ title: "Artigo publicado", description: "Seu novo artigo foi publicado com sucesso!" })
      } else {
        toast({ title: "Erro", description: "Não foi possível publicar o artigo.", variant: "destructive" })
      }
    }
    setIsEditing(false)
    setCurrentPost(null)
    const posts = await getBlogPostsByAuthor(authorId) // Refresh posts
    setMyPosts(posts)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
        <p className="text-[#1E1D40]/70 font-medium ml-4">Carregando seus artigos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Meu Blog</h1>
          <p className="text-gray-600">Crie, edite e gerencie seus artigos para a comunidade Busca Nutri.</p>
        </div>
        <Button
          onClick={handleNewPost}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {isEditing && currentPost ? (
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{currentPost.id ? "Editar Artigo" : "Criar Novo Artigo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={currentPost.title || ""}
                  onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Resumo</Label>
                <Textarea
                  id="excerpt"
                  value={currentPost.excerpt || ""}
                  onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={currentPost.content || ""}
                  onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={currentPost.category || ""}
                  onValueChange={(value) => setCurrentPost({ ...currentPost, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {blogCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Imagem de Capa</Label>
                <AdvancedImageUpload
                  onImageUploaded={(url) => setCurrentPost({ ...currentPost, image: url })}
                  onImageRemoved={() => setCurrentPost({ ...currentPost, image: "" })}
                  currentImageUrl={currentPost.image}
                  userId={authorId || ""}
                  disabled={!authorId}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={currentPost.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setCurrentPost({ ...currentPost, tags: e.target.value.split(",").map((t) => t.trim()) })
                  }
                  placeholder="saúde, bem-estar, nutrição"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={currentPost.featured || false}
                  onCheckedChange={(checked) => setCurrentPost({ ...currentPost, featured: !!checked })}
                />
                <Label htmlFor="featured">Artigo em Destaque</Label>
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {currentPost.id ? "Salvar Alterações" : "Publicar Artigo"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and View Mode */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "Todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("Todos")}
                  className={`transition-all duration-200 ${
                    selectedCategory === "Todos"
                      ? "bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 shadow-md"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  Todos
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {myPosts.length}
                  </Badge>
                </Button>
                {blogCategories.map((category) => (
                  <Button
                    key={category}
                    variant={category === selectedCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`transition-all duration-200 ${
                      category === selectedCategory
                        ? "bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 shadow-md"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {category}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {myPosts.filter((post) => post.category === category).length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-full border-2 border-gray-200 focus:border-[#4AB0D9] focus:ring-0"
                  />
                </div>
                <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-none px-4 py-2 transition-all duration-200 ${
                      viewMode === "grid" 
                        ? "bg-[#4AB0D9] text-white shadow-md" 
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`rounded-none px-4 py-2 transition-all duration-200 ${
                      viewMode === "list" 
                        ? "bg-[#4AB0D9] text-white shadow-md" 
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              Mostrando {filteredPosts.length} de {myPosts.length} artigos
              {searchTerm && (
                <span className="ml-2">
                  para &quot;<strong>{searchTerm}</strong>&quot;
                </span>
              )}
            </div>
          </div>

          {/* Articles List */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum artigo encontrado</h3>
              <p className="text-gray-500">
                {searchTerm
                    ? `Não encontramos artigos para "${searchTerm}". Tente outros termos.`
                    : "Você ainda não publicou nenhum artigo."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleNewPost} 
                  className="mt-6 bg-gradient-to-r from-[#4AB0D9] to-[#3A9BC1] hover:from-[#3A9BC1] hover:to-[#2E8AA8] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Publicar seu primeiro artigo
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md ${
                    viewMode === "list" ? "flex" : "flex flex-col h-full"
                  }`}
                >
                  <div className={`relative ${viewMode === "list" ? "w-80 flex-shrink-0" : "h-56"} bg-gray-50 rounded-t-lg overflow-hidden`}>
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={400}
                      height={200}
                      className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300`}
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 bg-white/95 text-[#4AB0D9] backdrop-blur-sm"
                    >
                      {post.category}
                    </Badge>
                    <Badge variant="outline" className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-xs">
                      {post.views.toLocaleString()} views
                    </Badge>
                  </div>

                  <CardContent className={`p-6 ${viewMode === "list" ? "flex-1" : "flex flex-col flex-1"}`}>
                    <Link href={`/blog/${post.id}`} className="block">
                      <h3
                        className={`font-bold text-[#1E1D40] mb-3 group-hover:text-[#4AB0D9] transition-colors ${
                          viewMode === "list" ? "text-xl" : "text-lg"
                        } line-clamp-2`}
                      >
                        {post.title}
                      </h3>
                    </Link>

                    <p className={`text-gray-600 mb-4 ${viewMode === "list" ? "text-base" : "text-sm"} line-clamp-3 flex-grow`}>
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate" title={post.author}>{formatAuthorName(post.author)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </div>
                    </div>

                    {/* Author Badges */}
                    {post.badges && post.badges.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500">Badges:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {post.badges.slice(0, 2).map((badge, index) => {
                            const IconComponent = badge.icon ? eval(badge.icon) : Award
                            return (
                              <div key={`post-${post.id}-badge-${badge.name}-${index}`} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs">
                                <IconComponent className="h-3 w-3" />
                                <span className="truncate">{badge.name}</span>
                              </div>
                            )
                          })}
                          {post.badges.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.badges.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-2">
                      <Link href={`/dashboard/nutricionistas/blog/${post.id}`} className="flex-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-gradient-to-r from-[#4AB0D9] to-[#3A9BC1] hover:from-[#3A9BC1] hover:to-[#2E8AA8] text-white font-medium py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                        >
                          Ver Post
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        className="flex-1 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                      >
                        <Trash className="h-4 w-4 mr-1.5" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
