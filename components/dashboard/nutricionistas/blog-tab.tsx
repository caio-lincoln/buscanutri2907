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
import {
  type BlogPost,
  getBlogPostsByAuthor,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
  blogCategories,
} from "@/lib/blog-data" // Importar funções e categorias do blog-data
import { getCurrentUser } from "@/lib/auth" // Para obter o ID do usuário logado

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
        // For mock data, we'll use a fixed authorId for now.
        // In a real app, this would be user.id
        const mockAuthorId = "4363a1ad-149b-4fcd-b725-dffa33109493" // Real nutritionist ID for mock purposes
        setAuthorId(mockAuthorId)
        const posts = getBlogPostsByAuthor(mockAuthorId)
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

  const handleDeletePost = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este artigo?")) {
      const success = deleteBlogPost(id)
      if (success) {
        setMyPosts(getBlogPostsByAuthor(authorId || "4363a1ad-149b-4fcd-b725-dffa33109493")) // Refresh posts
        toast({ title: "Artigo excluído", description: "O artigo foi removido com sucesso." })
      } else {
        toast({ title: "Erro", description: "Não foi possível excluir o artigo.", variant: "destructive" })
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
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
      const updated = updateBlogPost({
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
      const newPost = addBlogPost({
        ...currentPost,
        author: authorName,
        authorId: authorId,
        authorBio: authorBio,
        authorImage: authorImage,
        readTime: "5 min", // Default read time for new posts
        views: 0, // New posts start with 0 views
      } as Omit<BlogPost, "id" | "date" | "views">)
      if (newPost) {
        toast({ title: "Artigo publicado", description: "Seu novo artigo foi publicado com sucesso!" })
      } else {
        toast({ title: "Erro", description: "Não foi possível publicar o artigo.", variant: "destructive" })
      }
    }
    setIsEditing(false)
    setCurrentPost(null)
    setMyPosts(getBlogPostsByAuthor(authorId || "4363a1ad-149b-4fcd-b725-dffa33109493")) // Refresh posts
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
                <Label htmlFor="image">URL da Imagem de Capa</Label>
                <Input
                  id="image"
                  value={currentPost.image || ""}
                  onChange={(e) => setCurrentPost({ ...currentPost, image: e.target.value })}
                  placeholder="/placeholder.svg?height=400&width=800"
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
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
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
                  para "<strong>{searchTerm}</strong>"
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
                <Button onClick={handleNewPost} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar seu primeiro artigo
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <div className={`relative ${viewMode === "list" ? "w-80 flex-shrink-0" : ""}`}>
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={400}
                      height={200}
                      className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                        viewMode === "list" ? "w-full h-full" : "w-full h-56"
                      }`}
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

                  <CardContent className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <Link href={`/blog/${post.id}`} className="block">
                      <h3
                        className={`font-bold text-[#1E1D40] mb-3 group-hover:text-[#4AB0D9] transition-colors ${
                          viewMode === "list" ? "text-xl" : "text-lg"
                        }`}
                      >
                        {post.title}
                      </h3>
                    </Link>

                    <p className={`text-gray-600 mb-4 ${viewMode === "list" ? "text-base" : "text-sm line-clamp-3"}`}>
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
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
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-500">Badges:</span>
                        <div className="flex items-center gap-1">
                          {post.badges.slice(0, 2).map((badge, index) => {
                            const IconComponent = badge.icon ? eval(badge.icon) : Award
                            return (
                              <div key={index} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs">
                                <IconComponent className="h-3 w-3" />
                                <span>{badge.name}</span>
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

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        className="flex-1 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-all bg-transparent"
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-200 transition-all bg-transparent"
                      >
                        <Trash className="h-3 w-3 mr-2" />
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
