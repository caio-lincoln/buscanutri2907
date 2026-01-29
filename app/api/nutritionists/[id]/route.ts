import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '../../../../lib/supabase/server'

// GET - Buscar dados de um nutricionista específico
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const nutritionistId = params.id

    if (!nutritionistId) {
      return NextResponse.json(
        { error: 'ID do nutricionista é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se é usuário de teste e se quem solicita é admin
    // Usamos admin client para garantir acesso ao email, pois RLS pode bloquear para usuários anonimos
    const TEST_EMAILS = [ 'nutricionista@buscanutri.com', 'paciente@buscanutri.com', 'empresa@buscanutri.com' ]
    const adminSupabase = createAdminClient()
    const { data: userData } = await adminSupabase
      .from('users')
      .select('email')
      .eq('id', nutritionistId)
      .single()
    
    const userEmail = userData?.email

    if (userEmail && TEST_EMAILS.includes(userEmail)) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      let isAdmin = false
      if (authUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', authUser.id)
          .single()
        if (userProfile?.user_type === 'admin') isAdmin = true
      }

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Nutricionista não encontrado' },
          { status: 404 }
        )
      }
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
