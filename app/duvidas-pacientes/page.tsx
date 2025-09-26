'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Search,
  MessageCircle,
  Eye,
  ThumbsUp,
  Clock,
  ArrowRight,
  Home,
  Users,
} from 'lucide-react'
import { getAllForumQuestions, ForumQuestion } from '@/lib/forum-data'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ContentModeration, ModerationAction } from '@/components/ui/content-moderation'
import { createSupabaseClient } from '@/lib/supabase'

export default function DuvidasPacientesPage() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<ForumQuestion[]>(
    []
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await getAllForumQuestions()
        setQuestions(data)
        setFilteredQuestions(data)
      } catch (error) {
        // Error loading questions - handled silently
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions)
    } else {
      const filtered = questions.filter(
        question =>
          question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          question.tags.some(tag =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
      setFilteredQuestions(filtered)
    }
  }, [searchTerm, questions])

  const formatTimeAgo = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR,
    })
  }

  const handleModerationAction = async (questionId: string, action: ModerationAction): Promise<boolean> => {
    try {
      const supabase = createSupabaseClient()
      
      if (action.type === 'delete') {
        // Delete the forum question
        const { error } = await supabase
          .from('forum_questions')
          .delete()
          .eq('id', questionId)
        
        if (error) {
          console.error('Erro ao excluir pergunta:', error)
          return false
        }
        
        // Log the moderation action
        await supabase
          .from('moderation_logs')
          .insert({
            content_id: questionId,
            content_type: 'forum_question',
            action_type: action.type,
            reason: action.reason,
            category: action.category,
            notes: action.notes,
            moderator_id: 'current_user_id' // This should be replaced with actual user ID
          })
        
        // Refresh questions list
        const data = await getAllForumQuestions()
        setQuestions(data)
        setFilteredQuestions(data)
        return true
      } else if (action.type === 'flag') {
        // Flag the question for review
        const { error } = await supabase
          .from('forum_questions')
          .update({ 
            is_flagged: true,
            moderation_notes: action.notes 
          })
          .eq('id', questionId)
        
        if (error) {
          console.error('Erro ao sinalizar pergunta:', error)
          return false
        }
        
        // Log the moderation action
        await supabase
          .from('moderation_logs')
          .insert({
            content_id: questionId,
            content_type: 'forum_question',
            action_type: action.type,
            reason: action.reason,
            category: action.category,
            notes: action.notes,
            moderator_id: 'current_user_id' // This should be replaced with actual user ID
          })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro na ação de moderação:', error)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={140}
              height={28}
              className="h-6 w-auto transition-transform duration-300 hover:scale-105"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Início
            </Link>
            <Link
              href="/nutricionistas"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Nutricionistas
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9]"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="container px-4 md:px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm text-[#1E1D40]/60">
          <Link
            href="/"
            className="hover:text-[#4AB0D9] transition-colors flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <span>/</span>
          <Link
            href="/dashboard/paciente/forum"
            className="hover:text-[#4AB0D9] transition-colors flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            Fórum de Pacientes
          </Link>
          <span>/</span>
          <span className="text-[#4AB0D9] font-medium">Dúvidas</span>
        </nav>
      </div>

      <main className="container px-4 md:px-6 py-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-4">
            Dúvidas dos Pacientes
          </h1>
          <p className="text-lg text-[#1E1D40]/70 max-w-2xl mx-auto mb-8">
            Explore as perguntas mais frequentes da nossa comunidade de
            pacientes. Encontre respostas valiosas de nutricionistas
            especializados.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar dúvidas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-[#4AB0D9] focus:ring-[#4AB0D9]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="h-8 w-8 text-[#4AB0D9] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1E1D40]">
                {questions.length}
              </div>
              <div className="text-sm text-[#1E1D40]/60">Perguntas</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <ThumbsUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1E1D40]">
                {questions.reduce((acc, q) => acc + q.repliesCount, 0)}
              </div>
              <div className="text-sm text-[#1E1D40]/60">Respostas</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1E1D40]">
                {new Set(questions.map(q => q.author.id)).size}
              </div>
              <div className="text-sm text-[#1E1D40]/60">Pacientes Ativos</div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">
                {searchTerm
                  ? 'Nenhuma dúvida encontrada'
                  : 'Ainda não há dúvidas'}
              </h3>
              <p className="text-[#1E1D40]/60">
                {searchTerm
                  ? 'Tente buscar com outros termos ou navegue por todas as dúvidas.'
                  : 'Seja o primeiro a fazer uma pergunta na nossa comunidade!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map(question => (
              <Card
                key={question.id}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        href={`/duvidas-pacientes/${question.id}`}
                        className="block group"
                      >
                        <h3 className="text-lg font-semibold text-[#1E1D40] group-hover:text-[#4AB0D9] transition-colors mb-2">
                          {question.title}
                        </h3>
                      </Link>
                      <p className="text-[#1E1D40]/70 line-clamp-2 mb-3">
                        {question.content}
                      </p>

                      {/* Tags */}
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {question.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{question.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {question.isBestAnswerSelected && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Resolvida
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#1E1D40]/60">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{question.repliesCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{question.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{question.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(question.timestamp)}</span>
                      </div>
                    </div>

                    <Link href={`/duvidas-pacientes/${question.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#4AB0D9] hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/10"
                      >
                        Ver detalhes
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                    <ContentModeration
                      contentId={question.id}
                      contentType="forum_question"
                      contentTitle={question.title}
                      authorId={question.author.id}
                      onModerationAction={(action) => handleModerationAction(question.id, action)}
                    />
                  </div>

                  {/* Author info */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-[#4AB0D9]/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#4AB0D9]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1E1D40]">
                        {question.author.name}
                      </div>
                      <div className="text-xs text-[#1E1D40]/60">Paciente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-[#4AB0D9]/5 to-[#4AB0D9]/10 border-[#4AB0D9]/20">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
                Tem uma dúvida sobre nutrição?
              </h3>
              <p className="text-[#1E1D40]/70 mb-4">
                Cadastre-se como paciente e faça sua pergunta para nossa
                comunidade de nutricionistas especializados.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/cadastro?tipo=paciente">
                  <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    Cadastrar como Paciente
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white"
                  >
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E1D40] text-white py-12 mt-16">
        <div className="container px-4 md:px-6">
          <div className="text-center">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={160}
              height={32}
              className="h-8 w-auto mx-auto mb-4 brightness-0 invert"
            />
            <p className="text-white/70">
              Conectando nutricionistas e transformando vidas através da
              alimentação saudável.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
