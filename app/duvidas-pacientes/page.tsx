import { createClient } from '@/lib/supabase/server'
import type { ForumQuestion } from '@/lib/forum-data'
import DuvidasPacientesClient from './_client'

export default async function DuvidasPacientesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('forum_questions')
    .select(`
      id, title, content, created_at, likes_count, answers_count, views, tags, category, is_resolved, patient_id,
      patient_profiles:forum_questions_patient_id_fkey(full_name, profile_image_url)
    `)
    .not('patient_id', 'is', null)
    .order('created_at', { ascending: false })

  interface QuestionRow {
    id: string
    title: string
    content: string
    created_at: string
    likes_count?: number
    answers_count?: number
    views?: number
    tags?: string[]
    category?: string
    is_resolved?: boolean
    patient_id: string
    patient_profiles?: { full_name?: string; profile_image_url?: string } | null
  }

  const questions: ForumQuestion[] = (data || []).map((row: QuestionRow) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    author: {
      id: row.patient_id,
      name: row.patient_profiles?.full_name || 'Usuário Anônimo',
      userType: 'paciente',
      avatar: row.patient_profiles?.profile_image_url || '/placeholder.svg?height=40&width=40',
      isVerified: false,
    },
    timestamp: new Date(row.created_at).toLocaleString('pt-BR'),
    likes: row.likes_count || 0,
    repliesCount: row.answers_count || 0,
    views: row.views || 0,
    tags: row.tags || [],
    category: row.category || '',
    replies: [],
    isBestAnswerSelected: row.is_resolved || false,
  }))

  return <DuvidasPacientesClient initialQuestions={questions} />
}
