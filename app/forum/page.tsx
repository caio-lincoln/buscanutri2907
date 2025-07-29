"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  MoreHorizontal,
  Eye,
  HelpCircle,
  Search,
  Filter,
  ArrowDownWideNarrow,
  Award,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuestionModal } from "@/components/question-modal"
import { toast } from "@/components/ui/use-toast"

import { type ForumQuestion, getAllForumQuestions, likeForumItem, incrementQuestionViews } from "@/lib/forum-data"

export default function ForumPage() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sortOrder, setSortOrder] = useState("recent") // 'recent', 'likes', 'replies', 'views'

  const specialtiesOptions = [
    "Todas", // Option to clear category filter
    "Emagrecimento",
    "Ganho de Massa",
    "Diabetes",
    "Vegetarianismo",
    "Suplementação",
    "Alimentação Infantil",
    "Nutrição Clínica",
    "Nutrição Esportiva",
    "Distúrbios Alimentares",
    "Nutrição Geriátrica",
    "Nutrição Funcional",
  ]

  useEffect(() => {
    // Initialize questions with badges
    const loadQuestions = async () => {
      const questionsWithBadges = await getAllForumQuestions()
      setQuestions(questionsWithBadges)
    }
    loadQuestions()
  }, [])

  const handleQuestionPosted = async (newQuestion: ForumQuestion) => {
    const questionsWithBadges = await getAllForumQuestions()
    setQuestions(questionsWithBadges)
    toast({ title: "Pergunta publicada!", description: "Sua pergunta foi enviada para a comunidade." })
  }

  const handleLike = async (itemId: string, type: "question" | "reply") => {
    const success = likeForumItem(itemId, type)
    if (success) {
      const questionsWithBadges = await getAllForumQuestions()
      setQuestions(questionsWithBadges)
    }
  }

  const applyFiltersAndSort = (
    allQuestions: ForumQuestion[],
    searchTerm: string,
    selectedCategory: string,
    sortOrder: string,
  ) => {
    let filtered = [...allQuestions] // Create a mutable copy

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory && selectedCategory !== "Todas") {
      filtered = filtered.filter((q) => q.category === selectedCategory)
    }

    filtered.sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          // For mock data, a simple string comparison might not be accurate for "recent".
          // In a real app, use `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()`
          // For now, we'll assume newer items are added to the beginning of the array
          return allQuestions.indexOf(a) - allQuestions.indexOf(b)
        case "likes":
          return b.likes - a.likes
        case "replies":
          return b.repliesCount - a.repliesCount
        case "views":
          return b.views - a.views
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredAndSortedQuestions = useMemo(
    () => applyFiltersAndSort(questions, searchTerm, selectedCategory, sortOrder),
    [questions, searchTerm, selectedCategory, sortOrder],
  )

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Fórum da Comunidade</h1>
          <p className="text-gray-600">Compartilhe conhecimento, tire dúvidas e conecte-se com outros profissionais.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filtrar por especialidade" />
          </SelectTrigger>
          <SelectContent>
            {specialtiesOptions.map((specialty) => (
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
        {filteredAndSortedQuestions.length > 0 ? (
          filteredAndSortedQuestions.map((question) => (
            <Card key={question.id} className="border-0 shadow-lg backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={
                        question.author.avatar || `/placeholder.svg?height=36&width=36&query=${question.author.name}`
                      }
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {question.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1E1D40]">{question.author.name}</p>
                      {question.author.badges && question.author.badges.length > 0 && (
                        <div className="flex gap-1">
                          {question.author.badges.slice(0, 2).map((badge, index) => (
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
                          {question.author.badges.length > 2 && (
                            <span className="text-xs text-gray-500">+{question.author.badges.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{question.timestamp}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  href={`/forum/${question.id}`}
                  onClick={() => incrementQuestionViews(question.id)}
                  className="block"
                >
                  <h3 className="text-xl font-bold text-[#1E1D40] hover:underline">{question.title}</h3>
                  <p className="text-gray-700 line-clamp-2">{question.content}</p>
                </Link>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(question.id, "question")
                    }}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="h-4 w-4" /> {question.likes} Curtir
                  </Button>
                  <Link
                    href={`/forum/${question.id}`}
                    onClick={() => incrementQuestionViews(question.id)}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" /> Ver Discussão ({question.repliesCount})
                  </Link>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {question.views} Visualizações
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-gray-600 mb-6">Não há perguntas nesta categoria no momento.</p>
          </div>
        )}
      </div>

      <QuestionModal open={isModalOpen} onOpenChange={setIsModalOpen} onQuestionPosted={handleQuestionPosted} />
    </main>
  )
}
