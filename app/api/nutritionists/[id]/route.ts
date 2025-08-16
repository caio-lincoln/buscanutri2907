import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar dados de um nutricionista específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const nutritionistId = params.id

    if (!nutritionistId) {
      return NextResponse.json(
        { error: 'ID do nutricionista é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do nutricionista
    const { data: nutritionist, error } = await supabase
      .from('nutritionist_profiles')
      .select(`
        *,
        user:users!user_id(
          email,
          created_at
        )
      `)
      .eq('user_id', nutritionistId)
      .single()

    if (error) {
      console.error('Erro ao buscar nutricionista:', error)
      return NextResponse.json(
        { error: 'Nutricionista não encontrado' },
        { status: 404 }
      )
    }

    // Buscar estatísticas de avaliações
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('nutritionist_id', nutritionistId)

    let rating = 0
    let totalReviews = 0

    if (reviewStats && reviewStats.length > 0) {
      totalReviews = reviewStats.length
      const totalRating = reviewStats.reduce((sum, review) => sum + review.rating, 0)
      rating = totalRating / totalReviews
    }

    // Buscar especialidades
    const { data: specialties } = await supabase
      .from('nutritionist_specialties')
      .select(`
        specialty:specialties(name)
      `)
      .eq('nutritionist_id', nutritionistId)

    const specialtyNames = specialties?.map(s => s.specialty?.name).filter(Boolean) || []

    const nutritionistData = {
      ...nutritionist,
      rating: Number(rating.toFixed(1)),
      total_reviews: totalReviews,
      specialties: specialtyNames
    }

    return NextResponse.json({ nutritionist: nutritionistData })
  } catch (error) {
    console.error('Erro na API de nutricionista:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}