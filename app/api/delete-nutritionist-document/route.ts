import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

export async function DELETE(request: NextRequest) {
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

    // Parse do body
    const { documentId, userId, accessToken } = await request.json()

    // Deleting document - silent operation

    // Validações básicas
    if (!documentId || !userId || !accessToken) {
      return NextResponse.json(
        { error: 'documentId, userId e accessToken são obrigatórios' },
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
        { error: 'Apenas nutricionistas podem deletar documentos' },
        { status: 403 }
      )
    }

    // Buscar o documento
    const { data: document, error: docError } = await supabase
      .from('nutritionist_documents')
      .select('*')
      .eq('id', documentId)
      .eq('nutritionist_id', userId)
      .single()

    if (docError || !document) {
      // Document not found - silent error handling
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é comprovante de CRN (não pode ser deletado)
    if (document.document_type === 'crn_proof') {
      return NextResponse.json(
        {
          error:
            'Comprovante de CRN não pode ser removido. Apenas substituído.',
        },
        { status: 403 }
      )
    }

    // Deletar arquivo do storage
    const { error: storageError } = await supabase.storage
      .from('nutritionist-documents')
      .remove([document.storage_path])

    if (storageError) {
      // Error deleting file from storage - silent error handling
      // Continua mesmo com erro no storage para não deixar registro órfão
    }

    // Deletar registro do banco
    const { error: deleteError } = await supabase
      .from('nutritionist_documents')
      .delete()
      .eq('id', documentId)
      .eq('nutritionist_id', userId)

    if (deleteError) {
      // Error deleting document from database - silent error handling
      return NextResponse.json(
        { error: 'Erro ao deletar documento' },
        { status: 500 }
      )
    }

    // Document deleted successfully - silent operation

    return NextResponse.json({
      success: true,
      message: 'Certificado removido com sucesso',
    })
  } catch (error) {
    // Error deleting document - silent error handling
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
