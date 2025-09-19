import { NextRequest, NextResponse } from 'next/server'
import { profileViewsService } from '@/lib/profile-views-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()

    const { nutritionistId, referrer, sessionId, userAgent } = body

    if (!userAgent) {
      return NextResponse.json(
        { error: 'Requisição mal recebida' },
        { status: 400 }
      )
    }

    if (!nutritionistId || typeof nutritionistId !== 'string') {
      return NextResponse.json(
        { error: 'nutritionistId é obrigatório e deve ser uma string' },
        { status: 400 }
      )
    }

    const { error } = await supabase.rpc('record_profile_view', {
      p_nutritionist_id: nutritionistId,
      p_session_id: sessionId,
      p_referrer: referrer,
      p_user_agent: navigator.userAgent,
    })
    if (error) {
      return NextResponse.json(
        {
          error: 'Erro ao registrar visualização',
          message: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Visualização registrada com sucesso',

    })
  } catch (error) {
    console.log('Erro ao registrar visualização:', error)

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: 'Não foi possível registrar a visualização'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST para registrar visualizações.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST para registrar visualizações.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST para registrar visualizações.' },
    { status: 405 }
  )
}
