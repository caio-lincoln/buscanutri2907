"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ThumbsUp, 
  MessageCircle, 
  Search, 
  Filter, 
  Star,
  Heart,
  Send,
  ArrowLeft,
  Shield,
  CheckCircle,
  Eye
} from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { 
  getForumQuestionById, 
  createForumAnswer, 
  likeForumItem, 
  markBestAnswer,
  incrementQuestionViews,
  type ForumQuestion, 
  type ForumReply 
} from "@/lib/forum-data"
import { addFavoriteNutritionist } from "@/lib/consultation-service"

export default function NutritionistForumQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string

  // User and auth states
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter and search states for replies
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "best">("recent")

  // Data states
  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reply form states
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Load user and question data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const [user, questionData] = await Promise.all([
          getCurrentUser(),
          getForumQuestionById(questionId)
        ])
        
        setCurrentUser(user)
        setQuestion(questionData)

        if (questionData) {
          // Increment view count
          await incrementQuestionViews(questionId)
          
          // Replies are already included in the question data
          setReplies(questionData.replies || [])
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Erro ao carregar a pergunta")
      } finally {
        setLoading(false)
      }
    }

    if (questionId) {
      loadData()
    }
  }, [questionId])

  // Filter and sort replies
  const filteredAndSortedReplies = replies
    .filter(reply => 
      reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "likes":
          return b.likes - a.likes
        case "best":
          if (a.isBestAnswer && !b.isBestAnswer) return -1
          if (!a.isBestAnswer && b.isBestAnswer) return 1
          return b.likes - a.likes
        case "recent":
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })

  // Handle like question
  const handleLikeQuestion = async () => {
    if (!currentUser || !question) return

    try {
      await likeForumItem(question.id, "question", currentUser.id)
      setQuestion(prev => prev ? {
        ...prev,
        likes: prev.likes + 1,
        hasLiked: true
      } : null)
    } catch (error) {
      console.error("Erro ao curtir pergunta:", error)
    }
  }

  // Handle like reply
  const handleLikeReply = async (replyId: string) => {
    if (!currentUser) return

    try {
      await likeForumItem(replyId, "reply", currentUser.id)
      setReplies(prev => prev.map(reply => 
        reply.id === replyId 
          ? { ...reply, likes: reply.likes + 1, hasLiked: true }
          : reply
      ))
    } catch (error) {
      console.error("Erro ao curtir resposta:", error)
    }
  }

  // Handle mark as best answer
  const handleMarkAsBest = async (replyId: string) => {
    if (!currentUser || !question || currentUser.id !== question.author.id) return

    try {
      await markBestAnswer(question.id, replyId)
      setReplies(prev => prev.map(reply => ({
        ...reply,
        isBestAnswer: reply.id === replyId
      })))
    } catch (error) {
      console.error("Erro ao marcar como melhor resposta:", error)
    }
  }

  // Handle favorite nutritionist
  const handleFavoriteNutritionist = async (nutritionistId: string) => {
    if (!currentUser || currentUser.user_type !== 'patient') return

    try {
      await addFavoriteNutritionist(currentUser.id, nutritionistId)
      // Update UI to show favorited state
    } catch (error) {
      console.error("Erro ao favoritar nutricionista:", error)
    }
  }

  // Handle submit reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !question || !replyContent.trim()) return
    if (currentUser.user_type !== 'nutritionist') return

    try {
      setIsSubmittingReply(true)
      
      const newReply = await createForumAnswer(question.id, replyContent.trim(), currentUser.id)

      if (newReply) {
        setReplies(prev => [newReply, ...prev])
        setReplyContent("")
        
        // Update question reply count
        setQuestion(prev => prev ? {
          ...prev,
          replies: prev.replies + 1
        } : null)
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pergunta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Pergunta não encontrada"}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
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
                onClick={() => router.push('/dashboard/nutricionistas/forum')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Fórum
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Discussão do Fórum</h1>
            </div>
          </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={question.author.avatar} />
                  <AvatarFallback>
                    {question.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{question.author.name}</h3>
                    <Badge variant={question.author.userType === 'nutritionist' ? 'default' : 'secondary'}>
                      {question.author.userType === 'nutritionist' ? 'Nutricionista' : 'Paciente'}
                    </Badge>
                    {question.author.userType === 'nutritionist' && question.author.crn && (
                      <Badge variant="outline" className="text-xs">
                        CRN: {question.author.crn}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(question.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {currentUser?.user_type === 'patient' && question.author.userType === 'nutritionist' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFavoriteNutritionist(question.author.id)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favoritar
                </Button>
              )}
            </div>
            
            <CardTitle className="text-xl">{question.title}</CardTitle>
            
            {question.category && (
              <Badge variant="secondary" className="w-fit">
                {question.category}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 whitespace-pre-wrap">{question.content}</p>
              
              <div className="flex items-center gap-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLikeQuestion}
                  disabled={question.hasLiked}
                  className={question.hasLiked ? "text-blue-600" : ""}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {question.likes}
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MessageCircle className="h-4 w-4" />
                  {replies.length} respostas
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  {question.views} visualizações
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Form - Only for nutritionists */}
        {currentUser?.user_type === 'nutritionist' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sua Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  placeholder="Compartilhe seu conhecimento e ajude este paciente..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!replyContent.trim() || isSubmittingReply}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingReply ? "Enviando..." : "Responder"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Access restriction message for non-nutritionists */}
        {currentUser?.user_type !== 'nutritionist' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Apenas nutricionistas podem responder no fórum</span>
          </div>
        )}

        {/* Replies Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Respostas ({replies.length})
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar respostas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="recent">Mais recentes</option>
                <option value="likes">Mais curtidas</option>
                <option value="best">Melhor resposta</option>
              </select>
            </div>
          </div>

          {filteredAndSortedReplies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "Nenhuma resposta encontrada" : "Ainda não há respostas para esta pergunta"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedReplies.map((reply) => (
                <Card key={reply.id} className={reply.isBestAnswer ? "border-green-200 bg-green-50" : ""}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={reply.author.avatar} />
                            <AvatarFallback>
                              {reply.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{reply.author.name}</h4>
                              <Badge variant={reply.author.userType === 'nutritionist' ? 'default' : 'secondary'}>
                                {reply.author.userType === 'nutritionist' ? 'Nutricionista' : 'Paciente'}
                              </Badge>
                              {reply.author.userType === 'nutritionist' && reply.author.crn && (
                                <Badge variant="outline" className="text-xs">
                                  CRN: {reply.author.crn}
                                </Badge>
                              )}
                              {reply.isBestAnswer && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Melhor Resposta
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(reply.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        {currentUser?.id === question.author.id && !reply.isBestAnswer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsBest(reply.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como melhor
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeReply(reply.id)}
                          disabled={reply.hasLiked}
                          className={reply.hasLiked ? "text-blue-600" : ""}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          {reply.likes}
                        </Button>
                        
                        {currentUser?.user_type === 'patient' && reply.author.userType === 'nutritionist' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFavoriteNutritionist(reply.author.id)}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Favoritar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}