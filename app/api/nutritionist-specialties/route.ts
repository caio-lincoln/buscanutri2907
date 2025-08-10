import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { nutritionist_id, specialty_ids } = await request.json()

    if (!nutritionist_id || !Array.isArray(specialty_ids)) {
      return NextResponse.json(
        { error: 'nutritionist_id e specialty_ids são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está autenticado e é o próprio nutricionista
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    if (user.id !== nutritionist_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Remover especialidades existentes
    const { error: deleteError } = await supabase
      .from('nutritionist_specialties')
      .delete()
      .eq('nutritionist_id', nutritionist_id)

    if (deleteError) {
      // Error removing existing specialties - silent error handling
      return NextResponse.json(
        { error: 'Erro ao remover especialidades existentes' },
        { status: 500 }
      )
    }

    // Inserir novas especialidades
    if (specialty_ids.length > 0) {
      const specialtiesToInsert = specialty_ids.map((specialty_id: string) => ({
        nutritionist_id,
        specialty_id,
      }))

      const { error: insertError } = await supabase
        .from('nutritionist_specialties')
        .insert(specialtiesToInsert)

      if (insertError) {
        // Error inserting specialties - silent error handling
        return NextResponse.json(
          { error: 'Erro ao inserir especialidades' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Especialidades salvas com sucesso',
      count: specialty_ids.length,
    })
  } catch (error) {
    // Internal error saving specialties - silent error handling
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const nutritionist_id = searchParams.get('nutritionist_id')

    if (!nutritionist_id) {
      return NextResponse.json(
        { error: 'nutritionist_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar especialidades do nutricionista
    const { data: nutritionistSpecialties, error } = await supabase
      .from('nutritionist_specialties')
      .select(
        `
        specialty_id,
        specialties (
          id,
          name,
          description
        )
      `
      )
      .eq('nutritionist_id', nutritionist_id)

    if (error) {
      // Error fetching nutritionist specialties - silent error handling
      return NextResponse.json(
        { error: 'Erro ao buscar especialidades' },
        { status: 500 }
      )
    }

    const specialties =
      nutritionistSpecialties?.map(ns => ns.specialties).filter(Boolean) || []

    return NextResponse.json({
      specialties,
      specialty_ids: nutritionistSpecialties?.map(ns => ns.specialty_id) || [],
      total: specialties.length,
    })
  } catch (error) {
    // Error in specialties endpoint - silent error handling
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
