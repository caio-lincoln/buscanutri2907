"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ThumbsUp, 
  MessageCircle, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Clock,
  TrendingUp,
  Users,
  Stethoscope,
  User,
  ArrowLeft
} from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { QuestionModal } from "@/components/question-modal"
import { 
  getNutritionistForumQuestions,
  getAllForumQuestions,
  likeForumItem,
  type ForumQuestion 
} from "@/lib/forum-data"

export default function NutritionistForumPage() {
  const router = useRouter()

  // User and auth states
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "replies" | "views">("recent")

  // Data states
  const [patientQuestions, setPatientQuestions] = useState<ForumQuestion[]>([])
  const [nutritionistQuestions, setNutritionistQuestions] = useState<ForumQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("patients")

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const [user, allQuestions, nutritionistQuestionsData] = await Promise.all([
          getCurrentUser(),
          getAllForumQuestions(),
          getNutritionistForumQuestions()
        ])
        
        setCurrentUser(user)
        setPatientQuestions(allQuestions.filter(q => q.author.userType === 'paciente'))
        setNutritionistQuestions(nutritionistQuestionsData)
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Erro ao carregar perguntas do fórum")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Categories
  const categories = [
    { value: "all", label: "Todas as categorias" },
    { value: "nutricao-geral", label: "Nutrição Geral" },
    { value: "emagrecimento", label: "Emagrecimento" },
    { value: "ganho-massa", label: "Ganho de Massa" },
    { value: "nutricao-esportiva", label: "Nutrição Esportiva" },
    { value: "alimentacao-infantil", label: "Alimentação Infantil" },
    { value: "nutricao-clinica", label: "Nutrição Clínica" },
    { value: "vegetarianismo", label: "Vegetarianismo" },
    { value: "suplementacao", label: "Suplementação" }
  ]

  // Get current questions based on active tab
  const currentQuestions = activeTab === "patients" ? patientQuestions : nutritionistQuestions
  
  // Filter and sort questions
  const filteredAndSortedQuestions = currentQuestions
    .filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || question.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "likes":
          return b.likes - a.likes
        case "replies":
          return b.repliesCount - a.repliesCount
        case "views":
          return b.views - a.views
        case "recent":
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })

  // Handle like question
  const handleLikeQuestion = async (questionId: string) => {
    if (!currentUser) return

    try {
      await likeForumItem(questionId, currentUser.id, "question")
      
      // Update the appropriate questions array
      if (activeTab === "patients") {
        setPatientQuestions(prev => prev.map(question => 
          question.id === questionId 
            ? { ...question, likes: question.likes + 1, hasLiked: true }
            : question
        ))
      } else {
        setNutritionistQuestions(prev => prev.map(question => 
          question.id === questionId 
            ? { ...question, likes: question.likes + 1, hasLiked: true }
            : question
        ))
      }
    } catch (error) {
      console.error("Erro ao curtir pergunta:", error)
    }
  }

  // Handle question click
  const handleQuestionClick = (questionId: string) => {
    router.push(`/dashboard/nutricionistas/forum/${questionId}`)
  }

  // Handle new question success
  const handleQuestionSuccess = (newQuestion: ForumQuestion) => {
    if (newQuestion.author.userType === 'paciente') {
      setPatientQuestions(prev => [newQuestion, ...prev])
    } else {
      setNutritionistQuestions(prev => [newQuestion, ...prev])
    }
    setIsQuestionModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando fórum...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/nutricionistas')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fórum de Nutrição</h1>
                <p className="text-gray-600">Compartilhe conhecimento e ajude pacientes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsQuestionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pergunta
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Perguntas</p>
                  <p className="text-xl font-semibold">{patientQuestions.length + nutritionistQuestions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Suas Respostas</p>
                  <p className="text-xl font-semibold">
                    {[...patientQuestions, ...nutritionistQuestions].reduce((acc, q) => acc + (q.author.id === currentUser?.id ? q.repliesCount : 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ThumbsUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Curtidas</p>
                  <p className="text-xl font-semibold">
                    {[...patientQuestions, ...nutritionistQuestions].reduce((acc, q) => acc + q.likes, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Visualizações</p>
                  <p className="text-xl font-semibold">
                    {[...patientQuestions, ...nutritionistQuestions].reduce((acc, q) => acc + q.views, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar perguntas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="recent">Mais recentes</option>
                <option value="likes">Mais curtidas</option>
                <option value="replies">Mais respostas</option>
                <option value="views">Mais visualizadas</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Questions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perguntas de Pacientes
              <Badge variant="secondary" className="ml-2">
                {patientQuestions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="nutritionists" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Perguntas de Nutricionistas
              <Badge variant="secondary" className="ml-2">
                {nutritionistQuestions.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            {renderQuestionsList("Perguntas de Pacientes", "Pacientes fazem perguntas sobre nutrição e alimentação")}
          </TabsContent>

          <TabsContent value="nutritionists" className="space-y-4">
            {renderQuestionsList("Discussões entre Nutricionistas", "Nutricionistas compartilham conhecimento e discutem casos")}
          </TabsContent>
        </Tabs>

          {/* Question Modal */}
          <QuestionModal
            open={isQuestionModalOpen}
            onOpenChange={setIsQuestionModalOpen}
            onQuestionPosted={handleQuestionSuccess}
          />
        </div>
      </div>
    </div>
  )

  // Render questions list function
  function renderQuestionsList(title: string, description: string) {
    return (
      <>
        {error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedQuestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== "all" 
                  ? "Nenhuma pergunta encontrada com os filtros aplicados" 
                  : `Ainda não há ${activeTab === 'patients' ? 'perguntas de pacientes' : 'discussões entre nutricionistas'}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1" onClick={() => handleQuestionClick(question.id)}>
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={question.author.avatar} />
                            <AvatarFallback>
                              {question.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{question.author.name}</span>
                              <Badge variant={question.author.userType === 'nutricionista' ? 'default' : 'secondary'} className="text-xs">
                                {question.author.userType === 'nutricionista' ? 'Nutricionista' : 'Paciente'}
                              </Badge>
                              {question.author.userType === 'nutricionista' && question.author.credentials && (
                                <Badge variant="outline" className="text-xs">
                                  {question.author.credentials}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(question.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                          {question.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {question.content}
                        </p>
                        
                        {question.category && (
                          <Badge variant="secondary" className="mb-3">
                            {categories.find(c => c.value === question.category)?.label || question.category}
                          </Badge>
                        )}
                      </div>
                      
                      {currentUser?.id === question.author.id && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLikeQuestion(question.id)
                          }}
                          disabled={question.hasLiked}
                          className={question.hasLiked ? "text-blue-600" : ""}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {question.likes}
                        </Button>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MessageCircle className="h-4 w-4" />
                          {question.repliesCount}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Eye className="h-4 w-4" />
                          {question.views}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuestionClick(question.id)}
                      >
                        Ver discussão
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    )
  }
}