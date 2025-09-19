import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    nutritionistId: string
  }
}
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()

    const { nutritionistId } = await params

    if (!nutritionistId || typeof nutritionistId !== 'string') {
      return NextResponse.json(
        { error: 'nutritionistId é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('get_profile_view_stats', {
      p_nutritionist_id: nutritionistId,
    })

    if (error || !data) {
      return NextResponse.json(
        { error: 'Nutricionista não encontrado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      nutritionistId,
      stats: {
        totalViews: data[ 0 ].total_views,
        uniqueViews: data[ 0 ].unique_views,
        lastViewAt: data[ 0 ].last_view_at,
      },
    })
  } catch (error) {
    console.log('Erro ao obter estatísticas de visualização:', error)

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter as estatísticas de visualização'
      },
      { status: 500 }
    )
  }
}

// Métodos não permitidos
export async function POST() {
  return NextResponse.json(
    { error: 'Método não permitido. Use GET para obter estatísticas.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido. Use GET para obter estatísticas.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido. Use GET para obter estatísticas.' },
    { status: 405 }
  )
}