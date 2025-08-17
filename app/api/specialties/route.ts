import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Buscar todas as especialidades ordenadas alfabeticamente
    const { data: specialties, error } = await supabase
      .from('specialties')
      .select('id, name, description')
      .order('name', { ascending: true })

    if (error) {
      // Error loading specialties - handled silently
      return NextResponse.json(
        { error: 'Erro ao buscar especialidades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      specialties: specialties || [],
      total: specialties?.length || 0,
    })
  } catch (error) {
    // Internal error loading specialties - handled silently
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
