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
} from 'lucide-react'
import { ContentModeration, ModerationAction } from '@/components/ui/content-moderation'
import { createSupabaseClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ForumQuestion } from '@/lib/forum-data'

type Props = { initialQuestions: ForumQuestion[] }

export default function DuvidasPacientesClient({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState<ForumQuestion[]>(initialQuestions)
  const [filteredQuestions, setFilteredQuestions] = useState<ForumQuestion[]>(initialQuestions)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFilteredQuestions(initialQuestions)
  }, [initialQuestions])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredQuestions(
        questions.filter(q =>
          q.title.toLowerCase().includes(term) ||
          q.content.toLowerCase().includes(term) ||
          q.tags.some(tag => tag.toLowerCase().includes(term))
        )
      )
    }
  }, [searchTerm, questions])

  const parseBRDateTime = (ts: string): Date | null => {
    try {
      const m = ts.match(/(\d{2})\/(\d{2})\/(\d{4})(?:[,\s]+(\d{2}):(\d{2})(?::(\d{2}))?)?/)
      if (!m) return null
      const [, dd, mm, yyyy, HH = '00', MM = '00', SS = '00'] = m
      const iso = `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`
      const d = new Date(iso)
      return isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    try {
      const d1 = new Date(timestamp)
      const date = isNaN(d1.getTime()) ? parseBRDateTime(timestamp) : d1
      if (!date) return timestamp
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch {
      return timestamp
    }
  }

  const handleModerationAction = async (
    questionId: string,
    action: ModerationAction
  ): Promise<boolean> => {
    try {
      const supabase = createSupabaseClient()
      if (action.type === 'delete') {
        const { error } = await supabase.from('forum_questions').delete().eq('id', questionId)
        if (error) return false
        const remaining = questions.filter(q => q.id !== questionId)
        setQuestions(remaining)
        setFilteredQuestions(remaining)
        return true
      }
      if (action.type === 'flag') {
        const { error } = await supabase
          .from('forum_questions')
          .update({ is_flagged: true, moderation_notes: action.notes })
          .eq('id', questionId)
        if (error) return false
        return true
      }
      return false
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Image src="/logo-busca-nutri.png" alt="Busca Nutri" width={140} height={28} className="h-6 w-auto transition-transform duration-300 hover:scale-105" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300">Início</Link>
            <Link href="/nutricionistas" className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300">Nutricionistas</Link>
            <Link href="/blog" className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9]">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b bg-white/90">
        <div className="container px-4 md:px-6 py-4 flex items-center gap-2 text-sm text-[#1E1D40]/70">
          <Home className="h-4 w-4" />
          <span>/</span>
          <span>Dúvidas de Pacientes</span>
        </div>
      </div>

      <main className="container px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E1D40] tracking-tight">Dúvidas de Pacientes</h1>
          <p className="text-[#1E1D40]/70 mt-2">Encontre respostas para perguntas frequentes sobre nutrição e saúde.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Input placeholder="Buscar perguntas por título, conteúdo ou tags..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1E1D40]/60" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[#1E1D40]">{filteredQuestions.length} perguntas</Badge>
            <Badge variant="outline" className="text-[#1E1D40]">{questions.reduce((acc, q) => acc + q.views, 0)} visualizações</Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 p-6 h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map(question => (
              <Card key={question.id} className="border-gray-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1E1D40]">{question.title}</h3>
                      <p className="text-sm text-[#1E1D40]/70 line-clamp-2">{question.content}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-[#1E1D40]/70">
                    <div className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /><span>{question.repliesCount}</span></div>
                    <div className="flex items-center gap-1"><Eye className="h-4 w-4" /><span>{question.views}</span></div>
                    <div className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /><span>{question.likes}</span></div>
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{formatTimeAgo(question.timestamp)}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700">{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href={`/duvidas-pacientes/${question.id}`} className="inline-flex items-center text-[#4AB0D9] hover:text-[#1E1D40]">
                      <span>Ver detalhes</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                    <ContentModeration onModeration={action => handleModerationAction(question.id, action)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
