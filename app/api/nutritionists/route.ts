import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Parâmetros de filtro
    const searchTerm = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''
    const state = searchParams.get('state') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000')
    const onlineOnly = searchParams.get('onlineOnly') === 'true'
    const sortBy = searchParams.get('sortBy') || 'rating'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Query base para buscar nutricionistas
    let query = supabase
      .from('nutritionist_profiles')
      .select(`
        id,
        user_id,
        full_name,
        bio,
        specialties,
        city,
        state,
        address,
        profile_image_url,
        crn,
        rating,
        total_reviews,
        experience_years,
        consultation_price,
        offers_online_consultation,
        service_online_available,
        is_verified,
        created_at
      `)
      .eq('verification_status', 'aprovado')

    // Filtro por consulta online
    if (onlineOnly) {
      query = query.eq('offers_online_consultation', true)
    }

    // Filtro por estado
    if (state && state !== 'Todas') {
      query = query.eq('state', state)
    }

    // Filtro por preço
    if (minPrice > 0 || maxPrice < 1000) {
      query = query
        .gte('consultation_price', minPrice)
        .lte('consultation_price', maxPrice)
    }

    // Filtro por especialidade
    if (specialty && specialty !== 'Todas') {
      query = query.contains('specialties', [specialty])
    }

    // Filtro por termo de busca (nome, bio, cidade)
    if (searchTerm) {
      query = query.or(
        `full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
      )
    }

    // Ordenação
    switch (sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'price_low':
        query = query.order('consultation_price', { ascending: true })
        break
      case 'price_high':
        query = query.order('consultation_price', { ascending: false })
        break
      case 'experience':
        query = query.order('experience_years', { ascending: false })
        break
      case 'name':
        query = query.order('full_name', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data: nutritionists, error, count } = await query

    if (error) {
      console.error('Erro ao buscar nutricionistas:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar contagem total para paginação
    const { count: totalCount } = await supabase
      .from('nutritionist_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'aprovado')

    return NextResponse.json({
      nutritionists: nutritionists || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    })
  } catch (error) {
    console.error('Erro na API de nutricionistas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}