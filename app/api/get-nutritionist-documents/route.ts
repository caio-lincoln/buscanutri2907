import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseServiceKey) {
      // Supabase environment variables not configured - silent error handling
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const accessToken = searchParams.get('accessToken')
    const documentType = searchParams.get('documentType') // 'crn_proof', 'certificate', ou null para todos

    // Searching documents - silent operation

    // Validações básicas
    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'userId e accessToken são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar access token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken)
    if (authError || !user || user.id !== userId) {
      // Authentication error - silent error handling
      return NextResponse.json(
        { error: 'Token de acesso inválido' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é nutricionista
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (userError || userData?.user_type !== 'nutricionista') {
      // User is not a nutritionist - silent error handling
      return NextResponse.json(
        { error: 'Apenas nutricionistas podem acessar documentos' },
        { status: 403 }
      )
    }

    // Construir query
    let query = supabase
      .from('nutritionist_documents')
      .select('*')
      .eq('nutritionist_id', userId)
      .order('created_at', { ascending: false })

    // Filtrar por tipo se especificado
    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    // Executar query
    const { data: documents, error: docsError } = await query

    if (docsError) {
      // Error fetching documents - silent error handling
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      )
    }

    // Found documents - silent operation
    return NextResponse.json({
      success: true,
      documents: documents || [],
    })
  } catch (error) {
    // Error fetching documents - silent error handling
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
