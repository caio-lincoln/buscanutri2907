import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

// GET - Buscar badges de um nutricionista específico
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ nutritionistId: string }> }
) {
  try {
    const params = await props.params;
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { nutritionistId } = params
    
    if (!nutritionistId) {
      return NextResponse.json({ error: 'ID do nutricionista é obrigatório' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('nutritionist_badges')
      .select(`
        id,
        badge_id,
        awarded_at,
        awarded_by,
        notes,
        badge:badges (
          id,
          name,
          description,
          icon_url
        )
      `)
      .eq('nutritionist_id', nutritionistId)
      .order('awarded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching nutritionist badges:', error)
      return NextResponse.json({ error: 'Erro ao buscar badges do nutricionista' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/badges/nutritionist/[nutritionistId]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
