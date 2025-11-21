'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Star, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Course = {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  instructor_name?: string | null
  duration_hours?: number | null
  rating?: number | null
  category?: string | null
  status?: string | null
  redirect_url?: string | null
}

export function CoursesTab() {
  const client = useMemo(() => createSupabaseClient(), [])
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false)
  const [ratingValue, setRatingValue] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState<string>('')
  const [submittingRating, setSubmittingRating] = useState<boolean>(false)
  const [userRating, setUserRating] = useState<null | { id: string; rating: number; comment: string | null }>(null)

  const loadCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      // Mostrar cursos cadastrados pelos ADMIN e visíveis publicamente
      // Política RLS atual permite SELECT onde status IN ('ativo','published')
      const { data, error } = await client
        .from('courses')
        .select('id,title,description,thumbnail_url,instructor_name,duration_hours,rating,category,status,redirect_url')
        .is('nutritionist_id', null)
        .in('status', ['ativo', 'published'])
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      setCourses((data as Course[]) || [])
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserCourseRating = async () => {
    try {
      if (!user || !selectedCourse) {
        setUserRating(null)
        return
      }
      const { data, error } = await client
        .from('course_ratings')
        .select('id,rating,comment')
        .eq('course_id', selectedCourse.id)
        .eq('rater_id', user.id)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows returned
        console.error('Erro ao buscar avaliação do usuário:', error.message)
      }
      if (data) {
        setUserRating(data as any)
        setRatingValue((data as any).rating ?? 0)
        setRatingComment(((data as any).comment as string) ?? '')
      } else {
        setUserRating(null)
        setRatingValue(0)
        setRatingComment('')
      }
    } catch (err) {
      console.error('Falha ao carregar avaliação do usuário:', err)
      setUserRating(null)
    }
  }

  useEffect(() => {
    if (showDetails && selectedCourse) {
      fetchUserCourseRating()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetails, selectedCourse, user?.id])

  const hasCourses = useMemo(() => courses && courses.length > 0, [courses])

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Cursos e Educação Continuada
          </h1>
          <p className="text-gray-600">
            Amplie suas qualificações e mantenha-se atualizado com as últimas tendências.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Carregando cursos…</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : !hasCourses ? (
        <div className="p-4 text-sm text-muted-foreground">Nenhum curso disponível no momento.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="p-0 relative">
                <Image
                  src={course.thumbnail_url || '/placeholder.svg'}
                  alt={course.title}
                  width={300}
                  height={200}
                  className="rounded-t-lg object-cover w-full h-40"
                />
                {course.category ? (
                  <Badge variant="secondary" className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-xs font-semibold">
                    {course.category}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-[#1E1D40] text-lg">{course.title}</h3>
                {course.description ? (
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                ) : null}
                <div className="flex items-center text-sm text-gray-500 gap-4">
                  {course.rating !== null && course.rating !== undefined ? (
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 ${Number(course.rating) > 0 ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`} />
                      <span>{Number(course.rating ?? 0).toFixed(1)}</span>
                    </div>
                  ) : null}
                  {typeof course.duration_hours === 'number' ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{course.duration_hours}h</span>
                    </div>
                  ) : null}
                </div>
                {course.instructor_name ? (
                  <div className="text-xs text-gray-500">Instrutor: {course.instructor_name}</div>
                ) : null}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  variant="ghost"
                  className="w-full text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedCourse(course)
                    setShowDetails(true)
                  }}
                >
                  Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {showDetails && selectedCourse ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative z-50 w-full max-w-2xl">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="p-0 relative">
                <Image
                  src={selectedCourse.thumbnail_url || '/placeholder.svg'}
                  alt={selectedCourse.title}
                  width={800}
                  height={400}
                  className="rounded-t-lg object-cover w-full h-56"
                />
                {selectedCourse.category ? (
                  <Badge variant="secondary" className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-xs font-semibold">
                    {selectedCourse.category}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-[#1E1D40]">{selectedCourse.title}</h2>
                {selectedCourse.description ? (
                  <p className="text-gray-700 leading-relaxed">{selectedCourse.description}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Sem descrição disponível.</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {selectedCourse.rating !== null && selectedCourse.rating !== undefined ? (
                    <span className="inline-flex items-center gap-1"><Star className={`h-4 w-4 ${Number(selectedCourse.rating) > 0 ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`} /> {Number(selectedCourse.rating ?? 0).toFixed(1)}</span>
                  ) : null}
                  {typeof selectedCourse.duration_hours === 'number' ? (
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-gray-500" /> {selectedCourse.duration_hours}h</span>
                  ) : null}
                  {selectedCourse.instructor_name ? (
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4 text-gray-500" /> Instrutor: {selectedCourse.instructor_name}</span>
                  ) : null}
                  {/* Removido badge de status visual */}
                </div>
              </CardContent>
              <CardFooter className="p-6 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    const url = selectedCourse.redirect_url?.trim()
                    if (url) {
                      try {
                        window.open(url, '_blank', 'noopener,noreferrer')
                      } catch {}
                    }
                  }}
                  disabled={!selectedCourse.redirect_url}
                >
                  Acessar Curso
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsRatingOpen(true)
                    if (!userRating) {
                      fetchUserCourseRating()
                    }
                  }}
                >
                  {userRating ? 'Editar Avaliação' : 'Avaliar Curso'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedCourse(null)
                  }}
                >
                  Fechar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Modal de Avaliação de Curso (somente UI, sem backend) */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{userRating ? 'Editar Avaliação' : 'Avaliar Curso'}</DialogTitle>
            <DialogDescription>
              Como foi sua experiência com "{selectedCourse?.title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Avaliação</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRatingValue(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || ratingValue)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const r = hoveredRating || ratingValue
                  switch (r) {
                    case 1:
                      return 'Muito insatisfeito'
                    case 2:
                      return 'Insatisfeito'
                    case 3:
                      return 'Neutro'
                    case 4:
                      return 'Satisfeito'
                    case 5:
                      return 'Muito satisfeito'
                    default:
                      return 'Selecione uma avaliação'
                  }
                })()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-rating-comment">Comentário (opcional)</Label>
              <Textarea
                id="course-rating-comment"
                placeholder="Conte-nos mais sobre sua experiência..."
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRatingOpen(false)
                setRatingValue(0)
                setHoveredRating(0)
                setRatingComment('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedCourse) return
                if (ratingValue === 0) return
                setSubmittingRating(true)
                setError(null)
                try {
                  const userId = user?.id
                  if (!userId) throw new Error('Faça login para avaliar o curso')

                  const { error: upsertErr } = await client
                    .from('course_ratings')
                    .upsert(
                      {
                        course_id: selectedCourse.id,
                        rater_id: userId,
                        rating: ratingValue,
                        comment: ratingComment?.trim() || null,
                      },
                      { onConflict: 'course_id,rater_id' }
                    )
                  if (upsertErr) throw new Error(upsertErr.message)

                  // Atualiza avaliação do usuário e a média do curso
                  await fetchUserCourseRating()
                  await loadCourses()
                  // Buscar curso atualizado diretamente para evitar estado obsoleto
                  const { data: updatedCourse } = await client
                    .from('courses')
                    .select('id,title,description,thumbnail_url,instructor_name,duration_hours,rating,category,status,redirect_url')
                    .eq('id', selectedCourse.id)
                    .single()
                  if (updatedCourse) {
                    setSelectedCourse(updatedCourse as Course)
                  }

                  // Fechar modal
                  setIsRatingOpen(false)
                } catch (e: any) {
                  setError(e.message || 'Erro ao salvar avaliação')
                } finally {
                  setSubmittingRating(false)
                }
              }}
              disabled={ratingValue === 0 || submittingRating}
            >
              {submittingRating ? 'Salvando…' : userRating ? 'Salvar Alterações' : 'Enviar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
