// app/api/nutritionists/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    // Helper p/ aplicar filtros iguais na query e no count
    const applyFilters = (q: ReturnType<typeof supabase.from> extends infer T
      ? T extends any ? any : never : never) => {
      // Somente quem tem Stripe conectado
      q = q.eq('is_listed', true) // <- remova se quiser listar quem só criou a conta

      if (onlineOnly) {
        // Considera qualquer uma das flags de disponibilidade online
        // para evitar inconsistências entre campos
        q = q.or('online_consultation_available.eq.true,service_online_available.eq.true')
      }

      if (minPrice > 0 || maxPrice < 1000) {
        q = q.gte('consultation_price', minPrice)
             .lte('consultation_price', maxPrice)
      }

      if (specialty && specialty !== 'Todas') {
        // Se você mantém um JSON em 'specialties' no profile:
        // q = q.contains('specialties', [specialty])
        // Como você já traz via join, normalmente filtraria pelo join em uma view/função;
        // aqui mantemos o filtro de texto no searchTerm para simplificar.
      }

      if (searchTerm) {
        q = q.or(
          `full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
        )
      }

      // Se quiser filtrar por estado aqui (caso exista coluna state):
      if (state && state !== 'Todas') {
        // q = q.eq('state', state)
      }

      return q
    }

    // Query base
    let query = supabase
      .from('nutritionist_profiles')
      .select(`
        id,
        user_id,
        full_name,
        bio,
        specialties_join:nutritionist_specialties (
          specialty:specialties ( id, name )
        ),
        profile_image_url,
        crn,
        rating,
        total_reviews,
        experience_years,
        consultation_price,
        online_consultation_available,
        service_online_available,
        is_verified,
        created_at
      `)

    query = applyFilters(query)

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

    const { data: rows, error } = await query
    console.log("🚀 ~ GET ~ rows:", rows)

    if (error) {
      console.error('Erro ao buscar nutricionistas:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    const nutritionists = (rows || []).map((row: any) => {
      const { specialties_join, ...rest } = row
      const specialties = (specialties_join || [])
        .map((s: any) => s?.specialty?.name)
        .filter(Boolean)
      return {
        ...rest,
        consultation_price: Number(rest.consultation_price ?? 0),
        online_consultation_available: Boolean(rest.online_consultation_available),
        service_online_available: Boolean(rest.service_online_available),
        specialties,
      }
    })

    // Count com MESMOS filtros (sem paginação/ordenação)
    let countQuery = supabase
      .from('nutritionist_profiles')
      .select('id', { count: 'exact', head: true })

    countQuery = applyFilters(countQuery)

    const { count: totalCount, error: countError } = await countQuery
    if (countError) {
      console.error('Erro ao contar nutricionistas:', countError)
    }

    return NextResponse.json({
      nutritionists,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    })
  } catch (error) {
    console.error('Erro na API de nutricionistas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
