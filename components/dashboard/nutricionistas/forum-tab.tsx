'use client'

import { AvatarFallback } from '@/components/ui/avatar'

import { AvatarImage } from '@/components/ui/avatar'

import { Avatar } from '@/components/ui/avatar'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  MessageCircle,
  Heart,
  ExternalLink,
  ThumbsUp,
  Eye,
  HelpCircle,
  Award,
  Plus,
} from 'lucide-react'

import {
  type ForumQuestion,
  getAllForumQuestions,
  getNutritionistForumQuestions,
} from '@/lib/forum-data'
import { QuestionModal } from '@/components/question-modal'

export function ForumTab() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [nutritionistQuestions, setNutritionistQuestions] = useState<
    ForumQuestion[]
  >([])
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)

  useEffect(() => {
    // Initialize questions from forum data with badges
    const loadQuestions = async () => {
      const questionsWithBadges = await getAllForumQuestions()
      setQuestions(questionsWithBadges)

      const nutritionistQuestionsWithBadges =
        await getNutritionistForumQuestions()
      setNutritionistQuestions(nutritionistQuestionsWithBadges)
    }
    loadQuestions()
  }, [])

  const handleQuestionPosted = (newQuestion: ForumQuestion) => {
    setQuestions(prev => [newQuestion, ...prev])
  }

  // Calculate forum statistics
  const forumStats = useMemo(() => {
    const allQuestions = [...questions, ...nutritionistQuestions]
    const totalQuestions = allQuestions.length
    let totalReplies = 0
    let totalLikes = 0

    allQuestions.forEach(q => {
      totalLikes += q.likes
      totalReplies += q.replies.length
      q.replies.forEach(r => {
        totalLikes += r.likes
      })
    })

    return { totalQuestions, totalReplies, totalLikes }
  }, [questions, nutritionistQuestions])

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Fórum da Comunidade
          </h1>
          <p className="text-gray-600">
            Acompanhe as discussões e contribua com a comunidade.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setIsQuestionModalOpen(true)}
            className="bg-gradient-to-r from-[#4AB0D9] to-[#3A9BC1] hover:from-[#3A9BC1] hover:to-[#2A8BB1] shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Fazer Pergunta
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/dashboard/nutricionistas/forum">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para o Fórum Completo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Perguntas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forumStats.totalQuestions}
            </div>
            <p className="text-xs text-gray-500">
              Perguntas feitas na comunidade
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Respostas
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forumStats.totalReplies}</div>
            <p className="text-xs text-gray-500">Respostas fornecidas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Curtidas
            </CardTitle>
            <Heart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forumStats.totalLikes}</div>
            <p className="text-xs text-gray-500">
              Curtidas em perguntas e respostas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent-questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent-questions">
            Perguntas de Paciente
          </TabsTrigger>
          <TabsTrigger value="nutritionist-questions">
            Perguntas de Nutricionistas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent-questions" className="mt-6">
          <h2 className="text-2xl font-bold text-[#1E1D40] mb-6">
            Perguntas de Pacientes
          </h2>
          <div className="space-y-6">
            {questions.slice(0, 3).map(
              (
                question // Show top 3 recent questions
              ) => (
                <Card
                  key={question.id}
                  className="border-0 shadow-lg backdrop-blur-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            question.author.avatar ||
                            `/placeholder.svg?height=36&width=36&query=${question.author.name}`
                          }
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                          {question.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1E1D40]">
                            {question.author.name}
                          </p>
                          {question.author.badges &&
                            question.author.badges.length > 0 && (
                              <div className="flex gap-1">
                                {question.author.badges
                                  .slice(0, 2)
                                  .map((badge, index) => (
                                    <div
                                      key={`recent-question-${question.id}-badge-${badge.id || badge.name}-${index}`}
                                      className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                                      title={badge.name}
                                    >
                                      {badge.icon ? (
                                        <span className="text-xs">
                                          {badge.icon}
                                        </span>
                                      ) : (
                                        <Award className="w-2.5 h-2.5" />
                                      )}
                                    </div>
                                  ))}
                                {question.author.badges.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{question.author.badges.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(question.timestamp).toLocaleDateString(
                            'pt-BR'
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      href={`/dashboard/nutricionistas/forum/${question.id}`}
                      className="block"
                    >
                      <h3 className="text-xl font-bold text-[#1E1D40] hover:underline">
                        {question.title}
                      </h3>
                      <p className="text-gray-700 line-clamp-2">
                        {question.content}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" /> {question.likes}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />{' '}
                        {question.repliesCount}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {question.views}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            {questions.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
                  Nenhuma pergunta de paciente
                </h3>
                <p className="text-gray-600 mb-6">
                  Não há perguntas de pacientes no momento.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nutritionist-questions" className="mt-6">
          <h2 className="text-2xl font-bold text-[#1E1D40] mb-6">
            Perguntas de Nutricionistas
          </h2>
          <div className="space-y-6">
            {nutritionistQuestions.slice(0, 3).map(
              (
                question // Show top 3 nutritionist questions
              ) => (
                <Card
                  key={question.id}
                  className="border-0 shadow-lg backdrop-blur-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            question.author.avatar ||
                            `/placeholder.svg?height=36&width=36&query=${question.author.name}`
                          }
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                          {question.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1E1D40]">
                            {question.author.name}
                          </p>
                          {question.author.badges &&
                            question.author.badges.length > 0 && (
                              <div className="flex gap-1">
                                {question.author.badges
                                  .slice(0, 2)
                                  .map((badge, index) => (
                                    <div
                                      key={`nutritionist-question-${question.id}-badge-${badge.id || badge.name}-${index}`}
                                      className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                                      title={badge.name}
                                    >
                                      {badge.icon ? (
                                        <span className="text-xs">
                                          {badge.icon}
                                        </span>
                                      ) : (
                                        <Award className="w-2.5 h-2.5" />
                                      )}
                                    </div>
                                  ))}
                                {question.author.badges.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{question.author.badges.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(question.timestamp).toLocaleDateString(
                            'pt-BR'
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      href={`/dashboard/nutricionistas/forum/${question.id}`}
                      className="block"
                    >
                      <h3 className="text-xl font-bold text-[#1E1D40] hover:underline">
                        {question.title}
                      </h3>
                      <p className="text-gray-700 line-clamp-2">
                        {question.content}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" /> {question.likes}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />{' '}
                        {question.repliesCount}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {question.views}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            {nutritionistQuestions.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
                  Nenhuma pergunta de nutricionista
                </h3>
                <p className="text-gray-600 mb-6">
                  Não há perguntas de nutricionistas no momento.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <QuestionModal
        open={isQuestionModalOpen}
        onOpenChange={setIsQuestionModalOpen}
        onQuestionPosted={handleQuestionPosted}
      />
    </div>
  )
}
