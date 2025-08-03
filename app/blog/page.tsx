"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, User, ArrowRight, Search, Filter, Grid, List, ArrowLeft, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllBlogPosts, blogCategories, type BlogPost } from "@/lib/blog-data"

export default function BlogPage() {
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [visiblePosts, setVisiblePosts] = useState(6)

  useEffect(() => {
    const loadPosts = async () => {
      const posts = await getAllBlogPosts()
      setAllBlogPosts(posts)
    }
    loadPosts()
  }, [])

  const sortOptions = [
    { value: "recent", label: "Mais Recentes" },
    { value: "popular", label: "Mais Populares" },
    { value: "alphabetical", label: "A-Z" },
  ]

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = allBlogPosts.filter((post) => {
      const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesCategory && matchesSearch
    })

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.views - a.views
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return filtered
  }, [allBlogPosts, selectedCategory, searchTerm, sortBy])

  const featuredPost = allBlogPosts.find((post) => post.featured)
  const regularPosts = filteredAndSortedPosts.filter((post) => !post.featured).slice(0, visiblePosts)

  const loadMorePosts = () => {
    setVisiblePosts((prev) => prev + 6)
  }

  // SEO Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Busca Nutri",
    description: "Artigos, dicas e novidades sobre nutrição e saúde",
    url: "https://buscanutri.com/blog",
    publisher: {
      "@type": "Organization",
      name: "Busca Nutri",
      logo: {
        "@type": "ImageObject",
        url: "https://buscanutri.com/logo-busca-nutri.png",
      },
    },
    blogPost: allBlogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      author: {
        "@type": "Person",
        name: post.author,
      },
      datePublished: post.date,
      url: `https://buscanutri.com/blog/${post.id}`,
      image: `https://buscanutri.com${post.image}`,
      wordCount: Math.floor(post.content.split(" ").length), // Use actual content length
      timeRequired: post.readTime,
      keywords: post.tags.join(", "),
      articleSection: post.category,
    })),
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Back to Home Button */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-600 hover:text-[#4AB0D9] transition-colors">
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
              <h1 className="text-5xl md:text-6xl font-bold text-[#1E1D40] mb-6">Blog Busca Nutri</h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Artigos especializados, dicas práticas e as últimas novidades sobre nutrição e saúde para transformar
                sua vida
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar artigos, temas ou palavras-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                {["Todos", ...blogCategories].map((category) => (
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
                    {category !== "Todos" && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {allBlogPosts.filter((post) => post.category === category).length}
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
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

            {/* Results Info */}
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              Mostrando {Math.min(regularPosts.length, visiblePosts)} de {filteredAndSortedPosts.length} artigos
              {searchTerm && (
                <span className="ml-2">
                  para "<strong>{searchTerm}</strong>"
                </span>
              )}
            </div>
          </div>

          {/* Featured Post */}
          {featuredPost && selectedCategory === "Todos" && !searchTerm && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-12 bg-[#4AB0D9] rounded"></div>
                <h2 className="text-3xl font-bold text-[#1E1D40]">Artigo em Destaque</h2>
              </div>

              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg">
                <div className="lg:flex">
                  <div className="lg:w-1/2 relative">
                    <Image
                      src={featuredPost.image || "/placeholder.svg"}
                      alt={featuredPost.title}
                      width={500}
                      height={300}
                      className="w-full h-80 lg:h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white">⭐ Destaque</Badge>
                    </div>
                  </div>
                  <div className="lg:w-1/2 p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge variant="secondary" className="bg-[#4AB0D9]/10 text-[#4AB0D9] px-3 py-1">
                        {featuredPost.category}
                      </Badge>
                      <Badge variant="outline" className="text-gray-600">
                        {featuredPost.views.toLocaleString()} visualizações
                      </Badge>
                    </div>

                    <h3 className="text-3xl font-bold text-[#1E1D40] mb-4 leading-tight">{featuredPost.title}</h3>

                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">{featuredPost.excerpt}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredPost.date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>

                    {/* Author Badges */}
                    {featuredPost.badges && featuredPost.badges.length > 0 && (
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-sm text-gray-600">Especialista em:</span>
                        <div className="flex items-center gap-2">
                          {featuredPost.badges.slice(0, 3).map((badge, index) => (
                            <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                              {badge.icon ? (
                                <img src={badge.icon} alt={badge.name} className="w-3 h-3" />
                              ) : (
                                <Award className="w-3 h-3" />
                              )}
                              <span>{badge.name}</span>
                            </div>
                          ))}
                          {featuredPost.badges.length > 3 && (
                            <span className="text-xs text-gray-500">+{featuredPost.badges.length - 3} mais</span>
                          )}
                        </div>
                      </div>
                    )}

                    <Link href={`/blog/${featuredPost.id}`}>
                      <Button size="lg" className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white px-8">
                        Ler Artigo Completo
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Posts Grid/List */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-12 bg-[#4AB0D9] rounded"></div>
              <h2 className="text-3xl font-bold text-[#1E1D40]">
                {selectedCategory === "Todos" ? "Todos os Artigos" : `Categoria: ${selectedCategory}`}
              </h2>
            </div>

            {regularPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum artigo encontrado</h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `Não encontramos artigos para "${searchTerm}". Tente outros termos.`
                    : "Não há artigos nesta categoria ainda."}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                    Limpar Busca
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
                {regularPosts.map((post) => (
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
                      <h3
                        className={`font-bold text-[#1E1D40] mb-3 group-hover:text-[#4AB0D9] transition-colors ${
                          viewMode === "list" ? "text-xl" : "text-lg"
                        }`}
                      >
                        {post.title}
                      </h3>

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
                        <div className="flex items-center gap-1 mb-4">
                          <span className="text-xs text-gray-600">Especialista:</span>
                          <div className="flex items-center gap-1">
                            {post.badges.slice(0, 2).map((badge, index) => (
                              <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                                {badge.icon ? (
                                  <img src={badge.icon} alt={badge.name} className="w-3 h-3" />
                                ) : (
                                  <Award className="w-3 h-3" />
                                )}
                                <span>{badge.name}</span>
                              </div>
                            ))}
                            {post.badges.length > 2 && (
                              <span className="text-xs text-gray-500">+{post.badges.length - 2}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <Link href={`/blog/${post.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group-hover:bg-[#4AB0D9] group-hover:text-white group-hover:border-[#4AB0D9] transition-all bg-transparent"
                        >
                          Ler Artigo
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {regularPosts.length > 0 && visiblePosts < filteredAndSortedPosts.length && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMorePosts}
                className="px-8 py-3 hover:bg-[#4AB0D9] hover:text-white transition-all bg-transparent"
              >
                Carregar Mais Artigos ({filteredAndSortedPosts.length - visiblePosts} restantes)
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Newsletter Section */}
        <div className="bg-gradient-to-r from-[#1E1D40] to-[#2D2B5F] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Newsletter Busca Nutri</h2>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                Mantenha-se atualizado com os mais recentes artigos sobre nutrição, insights de especialistas e as
                principais tendências do setor de saúde e bem-estar. Conteúdo exclusivo entregue diretamente em sua
                caixa de entrada.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
                <input
                  type="email"
                  placeholder="Digite seu endereço de e-mail"
                  className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#4AB0D9]/30 text-lg"
                />
                <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 px-8 py-4 text-lg rounded-xl h-16 min-w-[160px] flex items-center justify-center">
                  Inscrever-se
                </Button>
              </div>

              <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                Ao se inscrever, você concorda em receber comunicações da Busca Nutri. Respeitamos sua privacidade e
                você pode cancelar sua inscrição a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
