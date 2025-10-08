'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Calendar,
  Tag,
  Image as ImageIcon,
  FileText,
  Clock,
  Globe,
  X,
  Loader2
} from 'lucide-react'
import { toast } from "sonner"
import { BlogPostsService, UpdateBlogPostData } from '@/lib/blog-posts-service'
import { BlogPost } from '@/lib/supabase'

export default function EditarPostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter()
  const { id: postId } = use(params as any) as { id: string }
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const [postData, setPostData] = useState<UpdateBlogPostData>({
    id: postId,
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    status: 'draft',
    featured_image_url: '',
    scheduled_for: '',
    meta_title: '',
    meta_description: ''
  })

  useEffect(() => {
    if (postId) {
      loadPost()
      loadCategories()
      loadPopularTags()
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
      setPostData({
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || '',
        category: data.category || '',
        tags: data.tags || [],
        status: data.status,
        featured_image_url: data.featured_image_url || '',
        scheduled_for: data.scheduled_for || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || ''
      })
    } catch (error) {
      console.error('Erro ao carregar post:', error)
      toast.error('Erro ao carregar post')
      router.push('/dashboard/nutricionistas/posts')
    } finally {
      setLoading(false)
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

  const loadPopularTags = async () => {
    try {
      const { data, error } = await BlogPostsService.getPopularTags(20)
      
      if (error) {
        console.error('Erro ao carregar tags:', error)
        return
      }

      setPopularTags(data || [])
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    }
  }

  const handleInputChange = (field: keyof UpdateBlogPostData, value: any) => {
    setPostData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !postData.tags?.includes(trimmedTag)) {
      handleInputChange('tags', [...(postData.tags || []), trimmedTag])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', postData.tags?.filter(tag => tag !== tagToRemove) || [])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (tagInput.trim()) {
        addTag(tagInput)
      }
    }
  }

  const handleSave = async (status?: 'draft' | 'published' | 'scheduled') => {
    if (!postData.title?.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    if (!postData.content?.trim()) {
      toast.error('Conteúdo é obrigatório')
      return
    }

    const finalStatus = status || postData.status
    
    if (finalStatus === 'scheduled' && !postData.scheduled_for) {
      toast.error('Data de agendamento é obrigatória para posts agendados')
      return
    }

    setSaving(true)
    try {
      const dataToSave = {
        ...postData,
        status: finalStatus,
        // Se não tiver excerpt, gerar automaticamente dos primeiros 150 caracteres do conteúdo
        excerpt: postData.excerpt || postData.content?.substring(0, 150) + '...',
        // Se não tiver meta_title, usar o título
        meta_title: postData.meta_title || postData.title,
        // Se não tiver meta_description, usar o excerpt
        meta_description: postData.meta_description || postData.excerpt || postData.content?.substring(0, 160)
      }

      const { data, error } = await BlogPostsService.updatePost(dataToSave)
      
      if (error) {
        toast.error('Erro ao salvar post: ' + error.message)
        return
      }

      const statusText = finalStatus === 'draft' ? 'salvo como rascunho' : 
                        finalStatus === 'published' ? 'publicado' : 'agendado'
      
      toast.success(`Post ${statusText} com sucesso!`)
      
      // Atualizar os dados locais
      if (data) {
        setPost(data)
      }
    } catch (error) {
      console.error('Erro ao salvar post:', error)
      toast.error('Erro ao salvar post')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    // Implementar preview em modal ou nova aba
    toast.info('Funcionalidade de preview em desenvolvimento')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/nutricionistas/posts')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Posts
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">
                Editar Post
              </h1>
              <p className="text-gray-600 mt-1">
                Editando: {post?.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!postData.title || !postData.content}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Título e Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Post *</Label>
                  <Input
                    id="title"
                    placeholder="Digite o título do seu post..."
                    value={postData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>
                
                <div>
                  <Label htmlFor="excerpt">Resumo/Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Breve descrição do post (será gerado automaticamente se não preenchido)"
                    value={postData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea
                    id="content"
                    placeholder="Escreva o conteúdo do seu post aqui..."
                    value={postData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={15}
                    className="min-h-[400px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Você pode usar Markdown para formatação
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO e Metadados
                </CardTitle>
                <CardDescription>
                  Otimize seu post para mecanismos de busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Título SEO</Label>
                  <Input
                    id="meta_title"
                    placeholder="Título otimizado para SEO (será o título do post se não preenchido)"
                    value={postData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="meta_description">Descrição SEO</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="Descrição para mecanismos de busca (máx. 160 caracteres)"
                    value={postData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {postData.meta_description?.length || 0}/160 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Configurações de Publicação */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={postData.status}
                    onValueChange={(value: 'draft' | 'published' | 'scheduled') => 
                      handleInputChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {postData.status === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduled_for">Data de Publicação</Label>
                    <Input
                      id="scheduled_for"
                      type="datetime-local"
                      value={postData.scheduled_for}
                      onChange={(e) => handleInputChange('scheduled_for', e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={() => handleSave('scheduled')}
                  disabled={saving || !postData.scheduled_for}
                  variant="outline"
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Agendar Publicação
                </Button>
              </CardContent>
            </Card>

            {/* Categoria */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={postData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="Nutrição">Nutrição</SelectItem>
                      <SelectItem value="Receitas">Receitas</SelectItem>
                      <SelectItem value="Suplementação">Suplementação</SelectItem>
                      <SelectItem value="Esporte">Esporte</SelectItem>
                      <SelectItem value="Pediatria">Pediatria</SelectItem>
                      <SelectItem value="Educação">Educação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ou criar nova categoria</Label>
                  <Input
                    placeholder="Nome da nova categoria"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim()
                        if (value) {
                          handleInputChange('category', value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tags">Adicionar Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Digite uma tag e pressione Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>

                {postData.tags && postData.tags.length > 0 && (
                  <div>
                    <Label>Tags Selecionadas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {postData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {popularTags.length > 0 && (
                  <div>
                    <Label>Tags Populares</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {popularTags
                        .filter(tag => !postData.tags?.includes(tag))
                        .slice(0, 10)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50"
                            onClick={() => addTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Imagem Destacada */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Imagem Destacada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="featured_image_url">URL da Imagem</Label>
                  <Input
                    id="featured_image_url"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={postData.featured_image_url}
                    onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                  />
                </div>

                {postData.featured_image_url && (
                  <div>
                    <Label>Preview</Label>
                    <img
                      src={postData.featured_image_url}
                      alt="Preview da imagem destacada"
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Post */}
            {post && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criado em:</span>
                    <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Atualizado em:</span>
                    <span>{new Date(post.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visualizações:</span>
                    <span>{post.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Curtidas:</span>
                    <span>{post.likes_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comentários:</span>
                    <span>{post.comments_count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
