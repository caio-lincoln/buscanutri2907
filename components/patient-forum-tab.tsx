'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ThumbsUp,
  MessageCircle,
  Eye,
  HelpCircle,
  Search,
  Filter,
  ArrowDownWideNarrow,
  Award,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuestionModal } from '@/components/question-modal'
import {
  getAllForumQuestionsWithNutritionists,
  likeForumItem,
  incrementQuestionViews,
  type ForumQuestion,
} from '@/lib/forum-data'
import { getCurrentUser } from '@/lib/auth'

export function PatientForumTab() {
  const router = useRouter()
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuestionForModal, setSelectedQuestionForModal] =
    useState<ForumQuestion | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortOrder, setSortOrder] = useState('recent') // 'recent', 'likes', 'replies', 'views'

  const specialtiesOptions = [
    'Todas', // Option to clear category filter
    'suplementos',
    'exercicios',
    'dieta',
    'saude',
    'nutricao',
  ]

  useEffect(() => {
    // Initialize questions from forum data
    const loadQuestions = async () => {
      try {
        // Silent operation: Loading real forum questions
        const allQuestions = await getAllForumQuestionsWithNutritionists()
        // Silent operation: Forum questions loaded successfully
        setQuestions(allQuestions)
      } catch (error) {
        // Silent error handling: Error loading forum questions
      }
    }
    loadQuestions()
  }, [])

  const handleOpenAskQuestionModal = () => {
    setSelectedQuestionForModal(null) // No initial question means "ask new" mode
    setIsModalOpen(true)
  }

  const handleOpenViewQuestionModal = async (question: ForumQuestion) => {
    // Increment views when opening question
    try {
      await incrementQuestionViews(question.id)
    } catch (error) {
      // Silent error handling: Error incrementing views
    }
    // Navigate to the specific forum question page within patient dashboard
    router.push(`/dashboard/paciente/forum/${question.id}`)
  }

  const handleQuestionPosted = async (newQuestion: ForumQuestion) => {
    try {
      const allQuestions = await getAllForumQuestionsWithNutritionists()
      setQuestions(allQuestions)
    } catch (error) {
      // Silent error handling: Error reloading forum questions
    }
  }

  const handleReplyPosted = async (questionId: string, reply: any) => {
    try {
      const allQuestions = await getAllForumQuestionsWithNutritionists()
      setQuestions(allQuestions)
    } catch (error) {
      // Silent error handling: Error reloading forum questions
    }
  }

  const handleLike = async (itemId: string, type: 'question' | 'reply') => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      const success = await likeForumItem(itemId, type, user.id)
      if (success) {
        // Reload questions to reflect the updated like count
        const allQuestions = await getAllForumQuestionsWithNutritionists()
        setQuestions(allQuestions)
      }
    } catch (error) {
      // Silent error handling: Error liking item
    }
  }

  const applyFiltersAndSort = (
    allQuestions: ForumQuestion[],
    searchTerm: string,
    selectedCategory: string,
    sortOrder: string
  ) => {
    let filtered = allQuestions

    if (searchTerm) {
      filtered = filtered.filter(
        q =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory && selectedCategory !== 'Todas') {
      filtered = filtered.filter(q => q.category === selectedCategory)
    }

    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        case 'likes':
          return (b.likes || 0) - (a.likes || 0)
        case 'replies':
          return (b.repliesCount || 0) - (a.repliesCount || 0)
        case 'views':
          return (b.views || 0) - (a.views || 0)
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredQuestions = useMemo(
    () =>
      applyFiltersAndSort(questions, searchTerm, selectedCategory, sortOrder),
    [questions, searchTerm, selectedCategory, sortOrder]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Minhas Dúvidas e Fórum
          </h1>
          <p className="text-gray-600">
            Tire suas dúvidas e veja o que a comunidade está discutindo.
          </p>
        </div>
        <Button
          onClick={handleOpenAskQuestionModal}
          className="bg-[#D90D32] hover:bg-[#D90D32]/90"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Fazer Nova Pergunta
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filtrar por especialidade" />
          </SelectTrigger>
          <SelectContent>
            {specialtiesOptions.map(specialty => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full md:w-[180px]">
            <ArrowDownWideNarrow className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="likes">Mais Curtidas</SelectItem>
            <SelectItem value="replies">Mais Respostas</SelectItem>
            <SelectItem value="views">Mais Visualizadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(question => (
            <Card
              key={question.id}
              className="border-0 shadow-lg backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={
                        question.author?.avatar ||
                        `/placeholder.svg?height=36&width=36&query=${question.author?.name || 'User'}`
                      }
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {(question.author?.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1E1D40]">
                        {question.author?.name || 'Usuário Anônimo'}
                      </p>
                      {question.author?.userType === 'nutricionista' &&
                        question.author?.isVerified && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(question.timestamp).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{question.category || 'Geral'}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-bold text-[#1E1D40]">
                  {question.title}
                </h3>
                <p className="text-gray-700 line-clamp-2">{question.content}</p>{' '}
                {/* Limit content to 2 lines */}
                <div className="flex flex-wrap gap-2">
                  {question.tags?.map((tag, index) => (
                    <Badge
                      key={`question-${question.id}-tag-${tag}-${index}`}
                      variant="outline"
                      className="text-xs"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        handleLike(question.id, 'question')
                      }}
                      className="flex items-center gap-1 p-0 h-auto hover:bg-transparent"
                    >
                      <ThumbsUp className="h-4 w-4" /> {question.likes || 0}
                    </Button>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />{' '}
                      {question.repliesCount || 0}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" /> {question.views || 0}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenViewQuestionModal(question)}
                    className="bg-[#D90D32] text-white hover:bg-[#D90D32]/90 hover:text-white"
                  >
                    Ver Pergunta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
              Nenhuma pergunta encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Ajuste seus filtros ou faça uma nova pergunta!
            </p>
          </div>
        )}
      </div>

      <QuestionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialQuestion={selectedQuestionForModal}
        onQuestionPosted={handleQuestionPosted}
        onReplyPosted={handleReplyPosted}
        onLike={handleLike}
      />
    </div>
  )
}
