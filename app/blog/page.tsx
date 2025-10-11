'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Search,
  Filter,
  Grid,
  List,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllBlogPosts, blogCategories, type BlogPost } from '@/lib/blog-data'
import { useRealtimeBlogViewsBulk } from '@/hooks/use-realtime-blog-views'

export default function BlogPage() {
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visiblePosts, setVisiblePosts] = useState(6)

  const blogPostIds = useMemo(() => allBlogPosts.map(p => p.id), [allBlogPosts])
  const { statsMap, isLoading, refreshStats, getStatsForPost } = useRealtimeBlogViewsBulk({
    blogPostIds,
  })

  useEffect(() => {
    const loadPosts = async () => {
      const posts = await getAllBlogPosts()
      setAllBlogPosts(posts)
      // Carregar estatísticas em lote após obter posts
      // Nota: o refresh aqui pode ocorrer antes de blogPostIds atualizar
      // por isso também chamamos outro efeito quando blogPostIds mudar
      refreshStats().catch(() => {})
    }
    loadPosts()
  }, [])

  // Atualizar estatísticas quando os IDs dos posts forem definidos/alterados
  useEffect(() => {
    if (blogPostIds.length === 0) return
    refreshStats().catch(() => {})
  }, [blogPostIds, refreshStats])

  // Função para obter visualizações atualizadas (temporariamente usando valores padrão)
  const getUpdatedViews = useCallback((post: BlogPost) => {
    const stats = getStatsForPost(post.id)
    // Prioriza estatísticas reais do banco; se ausentes, usa post.views
    if (stats && typeof stats.totalViews === 'number') {
      return stats.totalViews
    }
    return post.views || 0
  }, [getStatsForPost])

  const sortOptions = [
    { value: 'recent', label: 'Mais Recentes' },
    { value: 'popular', label: 'Mais Populares' },
    { value: 'alphabetical', label: 'A-Z' },
  ]

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = allBlogPosts.filter(post => {
      const matchesCategory =
        selectedCategory === 'Todos' || post.category === selectedCategory
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )

      return matchesCategory && matchesSearch
    })

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          const aViews = getUpdatedViews(a)
          const bViews = getUpdatedViews(b)
          return bViews - aViews
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return filtered
  }, [allBlogPosts, selectedCategory, searchTerm, sortBy, getUpdatedViews])

  const displayedPosts = filteredAndSortedPosts.slice(0, visiblePosts)

  const loadMorePosts = () => {
    setVisiblePosts(prev => prev + 6)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Back to Home Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-[#4AB0D9] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-[#1E1D40] mb-6">
              Blog Busca Nutri
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Artigos especializados, dicas práticas e as últimas novidades
              sobre nutrição e saúde para transformar sua vida
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar artigos, temas ou palavras-chave..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-[#4AB0D9] focus:ring-0"
              />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>{allBlogPosts.length} artigos publicados</span>
              <span>{blogCategories.length} categorias</span>
              <span>Atualizado semanalmente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 border">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {['Todos', ...blogCategories].map(category => (
                <Button
                  key={category}
                  variant={
                    category === selectedCategory ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`transition-all duration-200 ${category === selectedCategory
                    ? 'bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 shadow-md'
                    : 'hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  {category}
                  {category !== 'Todos' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {
                        allBlogPosts.filter(post => post.category === category)
                          .length
                      }
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            Mostrando {Math.min(displayedPosts.length, visiblePosts)} de{' '}
            {filteredAndSortedPosts.length} artigos
            {searchTerm && (
              <span className="ml-2">
                para "<strong>{searchTerm}</strong>"
              </span>
            )}
          </div>
        </div>

        {/* Regular Posts Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-12 bg-[#4AB0D9] rounded"></div>
            <h2 className="text-3xl font-bold text-[#1E1D40]">
              Todos os Artigos
            </h2>
          </div>

          {displayedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Nenhum artigo encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                    : 'space-y-6'
                }
              >
                {displayedPosts.map(post => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
                  >
                    <Link href={`/blog/${post.id}`}>
                      <div className="relative">
                        <Image
                          src={post.image}
                          alt={post.title}
                          width={400}
                          height={250}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-[#4AB0D9] text-white hover:bg-[#4AB0D9]/90">
                            {post.category}
                          </Badge>
                        </div>
                      </div>

                      <CardContent
                        className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className="text-xs text-gray-600"
                          >
                            {getUpdatedViews(post).toLocaleString()} visualizações
                          </Badge>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-[#1E1D40] mb-3 line-clamp-2 group-hover:text-[#4AB0D9] transition-colors">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <User className="h-4 w-4" />
                            {post.author}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#4AB0D9] hover:text-[#4AB0D9]/80 hover:bg-[#4AB0D9]/10 p-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-4">
                          {post.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Load More Button */}
        {displayedPosts.length > 0 &&
          visiblePosts < filteredAndSortedPosts.length && (
            <div className="text-center">
              <Button
                onClick={loadMorePosts}
                variant="outline"
                size="lg"
                className="px-8 py-3 text-[#4AB0D9] border-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white transition-all duration-200"
              >
                Carregar Mais Artigos (
                {filteredAndSortedPosts.length - visiblePosts} restantes)
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}
