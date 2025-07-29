"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, ThumbsUp, MessageCircle, Shield, CheckCircle, Eye, ArrowLeft, Award, Heart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image" // Importar Image

import {
  type ForumQuestion,
  type ForumReply,
  getForumQuestionById,
  addForumReply,
  likeForumItem,
  selectBestAnswer,
  incrementQuestionViews,
} from "@/lib/forum-data"
import { getCurrentUser } from "@/lib/auth" // Para obter o ID do usuário logado
import { addFavoriteNutritionist, removeFavoriteNutritionist, getPatientFavoriteNutritionists } from "@/lib/consultation-service"

export default function ForumQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string
  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null) // Estado para o usuário logado
  const [favoritedNutritionists, setFavoritedNutritionists] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchUserAndQuestion = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)

      // Load favorited nutritionists if user is a patient
      if (user && user.user_type === 'patient') {
        try {
          const favoritesData = await getPatientFavoriteNutritionists(user.id)
          const favoritedIds = new Set(favoritesData.map(fav => fav.nutritionist_id))
          setFavoritedNutritionists(favoritedIds)
        } catch (error) {
          console.error('Error loading favorite nutritionists:', error)
        }
      }

      if (questionId) {
        const fetchedQuestion = await getForumQuestionById(questionId)
        if (fetchedQuestion) {
          setQuestion(fetchedQuestion)
          // Increment views only once when the page loads
          incrementQuestionViews(questionId)
        } else {
          toast({
            title: "Pergunta não encontrada",
            description: "A pergunta que você está procurando não existe.",
            variant: "destructive",
          })
          router.push("/forum") // Redirect to forum list
        }
      }
    }
    fetchUserAndQuestion()
  }, [questionId, router])

  const handleToggleFavorite = async (nutritionistId: string) => {
    if (!currentUser || currentUser.user_type !== 'patient') {
      toast({
        title: "Acesso negado",
        description: "Apenas pacientes podem favoritar nutricionistas.",
        variant: "destructive",
      })
      return
    }

    try {
      const isFavorited = favoritedNutritionists.has(nutritionistId)
      
      if (isFavorited) {
        await removeFavoriteNutritionist(currentUser.id, nutritionistId)
        setFavoritedNutritionists(prev => {
          const newSet = new Set(prev)
          newSet.delete(nutritionistId)
          return newSet
        })
        toast({
          title: "Removido dos favoritos",
          description: "Nutricionista removido da sua lista de favoritos.",
        })
      } else {
        await addFavoriteNutritionist(currentUser.id, nutritionistId)
        setFavoritedNutritionists(prev => new Set([...prev, nutritionistId]))
        toast({
          title: "Adicionado aos favoritos",
          description: "Nutricionista adicionado à sua lista de favoritos.",
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handlePostReply = async () => {
    if (!question || !replyContent.trim()) {
      toast({
        title: "Resposta vazia",
        description: "Por favor, escreva sua resposta antes de enviar.",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para responder.",
        variant: "destructive",
      })
      return
    }

    const newReplyData: Omit<ForumReply, "id" | "timestamp" | "likes" | "isBestAnswer"> = {
      content: replyContent,
      author: {
        id: currentUser.id,
        name: currentUser.full_name || currentUser.email || 'Usuário',
        userType: currentUser.user_type || 'paciente',
        avatar: currentUser.profile_image_url || null,
        isVerified: currentUser.is_verified || false,
        credentials: currentUser.crn || currentUser.cnpj || null,
      },
    }

    const addedReply = addForumReply(question.id, newReplyData)
    if (addedReply) {
      // Re-fetch the question to get updated badges for the new reply author
      const updatedQuestion = await getForumQuestionById(question.id)
      if (updatedQuestion) {
        setQuestion(updatedQuestion)
      }
      setReplyContent("") // Clear input
      toast({ title: "Resposta enviada!", description: "Sua resposta foi publicada." })
    }
  }

  const handleLikeClick = (itemId: string, type: "question" | "reply") => {
    const success = likeForumItem(itemId, type)
    if (success) {
      // Update the current question/reply likes in state
      if (type === "question" && question && question.id === itemId) {
        setQuestion((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null))
      } else if (type === "reply" && question) {
        setQuestion((prev) => {
          if (!prev) return null
          const updatedReplies = prev.replies.map((r) => (r.id === itemId ? { ...r, likes: r.likes + 1 } : r))
          return { ...prev, replies: updatedReplies }
        })
      }
    }
  }

  const handleSelectBestAnswerClick = (questionId: string, replyId: string) => {
    const success = selectBestAnswer(questionId, replyId)
    if (success) {
      setQuestion((prev) => {
        if (!prev) return null
        const updatedReplies = prev.replies.map((r) => ({
          ...r,
          isBestAnswer: r.id === replyId,
        }))
        return { ...prev, replies: updatedReplies, isBestAnswerSelected: true }
      })
      toast({
        title: "Melhor resposta selecionada!",
        description: "Esta resposta foi marcada como a melhor para esta pergunta.",
      })
    }
  }

  if (!question) {
    return (
      <main className="container mx-auto px-4 py-8 md:py-12 text-center">
        <p className="text-gray-600">Carregando pergunta...</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#1E1D40]"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o Fórum
      </Button>

      <Card className="border-0 shadow-lg backdrop-blur-sm mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  question.author.avatar ||
                  `/placeholder.svg?height=40&width=40&query=${question.author.name || "user avatar"}`
                }
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-base font-semibold">
                {question.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-[#1E1D40]">{question.author.name}</p>
              <p className="text-sm text-gray-500">{question.timestamp}</p>
              {question.author.badges && question.author.badges.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {question.author.badges.slice(0, 3).map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                      title={badge.name}
                    >
                      {badge.icon ? (
                        <span className="text-xs">{badge.icon}</span>
                      ) : (
                        <Award className="w-2.5 h-2.5" />
                      )}
                    </div>
                  ))}
                  {question.author.badges.length > 3 && (
                    <span className="text-xs text-gray-500">+{question.author.badges.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-2xl font-bold text-[#1E1D40]">{question.title}</h3>
          <p className="text-gray-700">{question.content}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeClick(question.id, "question")}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="h-4 w-4" /> {question.likes} Curtir
            </Button>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {question.repliesCount} Respostas
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {question.views} Visualizações
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
        <h4 className="text-lg font-semibold text-[#1E1D40]">Respostas ({question.replies.length})</h4>
        {question.replies.length > 0 ? (
          question.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={reply.author.avatar || `/placeholder.svg?height=36&width=36&query=${reply.author.name}`}
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-semibold">
                  {reply.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#1E1D40]">{reply.author.name}</p>
                    {reply.author.userType === "nutricionista" && (
                      <Badge className="bg-[#4AB0D9] text-white text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Nutricionista
                      </Badge>
                    )}
                    {reply.author.badges && reply.author.badges.length > 0 && (
                      <div className="flex gap-1">
                        {reply.author.badges.slice(0, 2).map((badge, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                            title={badge.name}
                          >
                            {badge.icon ? (
                              <span className="text-xs">{badge.icon}</span>
                            ) : (
                              <Award className="w-2.5 h-2.5" />
                            )}
                          </div>
                        ))}
                        {reply.author.badges.length > 2 && (
                          <span className="text-xs text-gray-500">+{reply.author.badges.length - 2}</span>
                        )}
                      </div>
                    )}
                    {reply.isBestAnswer && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Melhor resposta
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{reply.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700">{reply.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeClick(reply.id, "reply")}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" /> {reply.likes} Curtir
                    </Button>
                    {reply.author.userType === "nutricionista" && currentUser?.user_type === "patient" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(reply.author.id)}
                        className={`flex items-center gap-1 ${
                          favoritedNutritionists.has(reply.author.id)
                            ? "text-red-600 hover:text-red-700"
                            : "text-gray-500 hover:text-red-600"
                        }`}
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            favoritedNutritionists.has(reply.author.id) ? "fill-current" : ""
                          }`}
                        />
                        {favoritedNutritionists.has(reply.author.id) ? "Favoritado" : "Favoritar"}
                      </Button>
                    )}
                  </div>
                  {question.author.userType === "paciente" && !question.isBestAnswerSelected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectBestAnswerClick(question.id, reply.id)}
                    >
                      Marcar como Melhor
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Nenhuma resposta ainda. Seja o primeiro a responder!</p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <Label htmlFor="replyContent" className="text-sm font-medium text-gray-700 mb-2">
          Sua Resposta
        </Label>
        <Textarea
          id="replyContent"
          placeholder="Escreva sua resposta aqui..."
          rows={3}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className="mt-1"
        />
        <Button onClick={handlePostReply} className="mt-3">
          <Send className="h-4 w-4 mr-2" />
          Responder
        </Button>
      </div>
    </main>
  )
}
