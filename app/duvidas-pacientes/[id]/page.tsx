'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  MessageCircle,
  Eye,
  ThumbsUp,
  Clock,
  Home,
  Users,
  CheckCircle,
  Award,
  Star,
} from 'lucide-react'
import { getForumQuestionById, type ForumQuestion } from '@/lib/forum-data'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DuvidaPacienteDetalhePage() {
  const params = useParams()
  const questionId = params.id as string
  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) return

      try {
        setLoading(true)
        const data = await getForumQuestionById(questionId)
        if (data) {
          setQuestion(data)
        } else {
          setError('Pergunta não encontrada')
        }
      } catch (error) {
        // Error loading question - handled silently
        setError('Erro ao carregar a pergunta')
      } finally {
        setLoading(false)
      }
    }

    loadQuestion()
  }, [questionId])

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(
        timestamp.replace(
          /(d{2})\/(d{2})\/(d{4}), (d{2}):(d{2}):(d{2})/,
          '$3-$2-$1T$4:$5:$6'
        )
      )
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch {
      return timestamp
    }
  }

  if (loading) {
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
          </div>
        </header>

        <main className="container px-4 md:px-6 py-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (error || !question) {
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
          </div>
        </header>

        <main className="container px-4 md:px-6 py-8 max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">
                {error || 'Pergunta não encontrada'}
              </h3>
              <p className="text-[#1E1D40]/60 mb-4">
                A pergunta que você está procurando não existe ou foi removida.
              </p>
              <Link href="/duvidas-pacientes">
                <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Dúvidas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
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
              href="/duvidas-pacientes"
              className="text-sm font-medium text-[#4AB0D9] hover:text-[#4AB0D9] transition-all duration-300"
            >
              Dúvidas
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
          <Link
            href="/duvidas-pacientes"
            className="hover:text-[#4AB0D9] transition-colors"
          >
            Dúvidas
          </Link>
          <span>/</span>
          <span className="text-[#4AB0D9] font-medium truncate max-w-xs">
            {question.title}
          </span>
        </nav>
      </div>

      <main className="container px-4 md:px-6 py-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/duvidas-pacientes">
            <Button
              variant="ghost"
              className="text-[#4AB0D9] hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dúvidas
            </Button>
          </Link>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E1D40] mb-4">
                  {question.title}
                </h1>

                {/* Tags */}
                {question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {question.isBestAnswerSelected && (
                <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Resolvida
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-[#1E1D40]/60">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{question.repliesCount} respostas</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{question.views} visualizações</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{question.likes} curtidas</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTimeAgo(question.timestamp)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Question Content */}
            <div className="prose prose-gray max-w-none mb-6">
              <p className="text-[#1E1D40] leading-relaxed whitespace-pre-wrap">
                {question.content}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Author Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4AB0D9]/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#4AB0D9]" />
              </div>
              <div>
                <div className="font-medium text-[#1E1D40]">
                  {question.author.name}
                </div>
                <div className="text-sm text-[#1E1D40]/60">Paciente</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#1E1D40]">
              Respostas ({question.repliesCount})
            </h2>
          </div>

          {question.replies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">
                  Ainda não há respostas
                </h3>
                <p className="text-[#1E1D40]/60 mb-4">
                  Seja o primeiro nutricionista a responder esta pergunta.
                </p>
                <Link href="/cadastro?tipo=nutricionista">
                  <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    Cadastrar como Nutricionista
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {question.replies.map(reply => (
                <Card
                  key={reply.id}
                  className={
                    reply.isBestAnswer ? 'border-green-200 bg-green-50/50' : ''
                  }
                >
                  <CardContent className="p-6">
                    {reply.isBestAnswer && (
                      <div className="flex items-center gap-2 mb-4 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium text-sm">
                          Melhor Resposta
                        </span>
                      </div>
                    )}

                    <div className="prose prose-gray max-w-none mb-4">
                      <p className="text-[#1E1D40] leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4AB0D9]/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-[#4AB0D9]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#1E1D40]">
                              {reply.author.name}
                            </span>
                            {reply.author.isVerified && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                Verificado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-[#1E1D40]/60">
                            Nutricionista
                            {reply.author.credentials &&
                              ` • ${reply.author.credentials}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[#1E1D40]/60">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{reply.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(reply.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-[#4AB0D9]/5 to-[#4AB0D9]/10 border-[#4AB0D9]/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
                Tem uma pergunta sobre nutrição?
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
