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
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { QuestionModal } from '@/components/question-modal'
import {
  getAllForumQuestionsWithNutritionists,
  likeForumItem,
  incrementQuestionViews,
  deleteForumQuestion,
  type ForumQuestion,
} from '@/lib/forum-data'
import { getCurrentUser } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Função para formatar datas de forma segura
const formatQuestionDate = (timestamp: string): string => {
  console.log('Formatando timestamp:', timestamp, 'Tipo:', typeof timestamp)
  
  try {
    // Se o timestamp for undefined ou null
    if (!timestamp) {
      console.log('Timestamp vazio ou undefined')
      return 'Data não disponível'
    }
    
    // Se o timestamp já está formatado (contém espaços ou barras), retorna como está
    if (timestamp.includes('/') || timestamp.includes(' ')) {
      console.log('Timestamp já formatado:', timestamp)
      return timestamp
    }
    
    // Caso contrário, tenta converter de ISO string
    const date = new Date(timestamp)
    console.log('Data convertida:', date, 'É válida:', !isNaN(date.getTime()))
    
    if (isNaN(date.getTime())) {
      console.log('Data inválida para timestamp:', timestamp)
      return 'Data inválida'
    }
    
    const formatted = date.toLocaleDateString('pt-BR')
    console.log('Data formatada:', formatted)
    return formatted
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Timestamp:', timestamp)
    return 'Data inválida'
  }
}

export function PatientForumTab() {
  const router = useRouter()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuestionForModal, setSelectedQuestionForModal] =
    useState<ForumQuestion | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortOrder, setSortOrder] = useState('recent') // 'recent', 'likes', 'replies', 'views'
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentPatientProfile, setCurrentPatientProfile] = useState<any>(null)

  const specialtiesOptions = [
    'Todas', // Option to clear category filter
    'suplementos',
    'exercicios',
    'dieta',
    'saude',
    'nutricao',
  ]

  useEffect(() => {
    // Initialize questions from forum data and load current user
    const loadData = async () => {
      try {
        // Load current user and patient profile
        const user = await getCurrentUser()
        setCurrentUser(user)

        if (user) {
          const supabaseClient = createSupabaseClient()
          const { data: patientProfile } = await supabaseClient
            .from('patient_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setCurrentPatientProfile(patientProfile)
        }

        // Silent operation: Loading real forum questions
        const allQuestions = await getAllForumQuestionsWithNutritionists()
        // Silent operation: Forum questions loaded successfully
        setQuestions(allQuestions)
      } catch (error) {
        // Silent error handling: Error loading forum questions
      }
    }
    loadData()
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentUser || !currentPatientProfile) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para excluir uma pergunta.',
        variant: 'destructive',
      })
      return
    }

    try {
      const supabaseClient = createSupabaseClient()
      
      // Delete the question using the patient profile ID
      const { error } = await supabaseClient
        .from('forum_questions')
        .delete()
        .eq('id', questionId)
        .eq('patient_id', currentPatientProfile.id) // Use patient_id for verification

      if (error) {
        throw error
      }

      toast({
        title: 'Pergunta deletada',
        description: 'Sua pergunta foi removida com sucesso.',
      })

      // Reload questions to reflect the change
      const allQuestions = await getAllForumQuestionsWithNutritionists()
      setQuestions(allQuestions)
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a pergunta. Tente novamente.',
        variant: 'destructive',
      })
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

  // Check if current user is the author of a question
  const isQuestionAuthor = (question: ForumQuestion) => {
    return currentPatientProfile && question.author?.id === currentPatientProfile.id
  }

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
                      {formatQuestionDate(question.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{question.category || 'Geral'}</Badge>
                  {isQuestionAuthor(question) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir pergunta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita e todas as respostas também serão removidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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
