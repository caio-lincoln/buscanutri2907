import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

export async function POST(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseServiceKey) {
      // Silent error handling - environment variables not configured
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Parse do form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const documentType = formData.get('documentType') as string // 'crn_proof' or 'certificate'
    const title = formData.get('title') as string // Required for certificates
    const accessToken = formData.get('accessToken') as string

    // Silent operation - document upload details

    // Validações básicas
    if (!file || !userId || !documentType || !accessToken) {
      return NextResponse.json(
        {
          error: 'Arquivo, userId, documentType e accessToken são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar se é certificado e tem título
    if (documentType === 'certificate' && (!title || title.trim() === '')) {
      return NextResponse.json(
        { error: 'Título é obrigatório para certificados' },
        { status: 400 }
      )
    }

    // Validar access token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken)
    if (authError || !user || user.id !== userId) {
      // Silent error handling - authentication error
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
      // Silent error handling - user is not a nutritionist
      return NextResponse.json(
        { error: 'Apenas nutricionistas podem fazer upload de documentos' },
        { status: 403 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use PDF, JPG ou PNG.' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Para CRN proof, verificar se já existe um documento
    if (documentType === 'crn_proof') {
      const { data: existingDoc, error: checkError } = await supabase
      .from('nutritionist_documents')
      .select('id')
      .eq('nutritionist_id', userId)
      .eq('document_type', 'crn_proof')
      .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // Silent error handling - error checking existing document
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }

      // Se já existe, será uma substituição
      if (existingDoc) {
        // Silent operation - replacing existing CRN proof
      }
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedTitle = title
      ? title.replace(/[^a-zA-Z0-9s]/g, '').replace(/s+/g, '-')
      : ''
    const fileName =
      documentType === 'crn_proof'
        ? `crn-proof-${timestamp}.${fileExtension}`
        : `certificate-${sanitizedTitle}-${timestamp}.${fileExtension}`

    // Definir caminho no storage
    const storagePath = `${userId}/${documentType}/${fileName}`

    // Silent operation - uploading file

    // Fazer upload do arquivo
    const { error: uploadError } = await supabase.storage
      .from('nutritionist-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) {
      // Silent error handling - upload error
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // Obter URL pública (mesmo sendo bucket privado, precisamos da URL para referência)
    const { data: urlData } = supabase.storage
      .from('nutritionist-documents')
      .getPublicUrl(storagePath)

    // Salvar metadados no banco de dados
    const documentData = {
      nutritionist_id: userId,
      document_type: documentType,
      title: documentType === 'certificate' ? title : null,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      is_verified: false,
    }

    // Se é substituição de CRN proof, fazer update
    if (documentType === 'crn_proof') {
      const { data: existingDoc } = await supabase
        .from('nutritionist_documents')
        .select('id, storage_path')
        .eq('nutritionist_id', userId)
        .eq('document_type', 'crn_proof')
        .single()

      if (existingDoc) {
        // Deletar arquivo antigo do storage
        await supabase.storage
          .from('nutritionist-documents')
          .remove([existingDoc.storage_path])

        // Atualizar registro existente
        const { data: updatedDoc, error: updateError } = await supabase
          .from('nutritionist_documents')
          .update(documentData)
          .eq('id', existingDoc.id)
          .select()
          .single()

        if (updateError) {
          // Silent error handling - document update error
          return NextResponse.json(
            { error: 'Erro ao salvar metadados do documento' },
            { status: 500 }
          )
        }

        // Silent operation - CRN proof replaced successfully
        return NextResponse.json({
          document: updatedDoc,
          message: 'Comprovante de CRN substituído com sucesso',
        })
      }
    }

    // Inserir novo documento
    const { data: newDoc, error: insertError } = await supabase
      .from('nutritionist_documents')
      .insert(documentData)
      .select()
      .single()

    if (insertError) {
      // Silent error handling - document save error

      // Limpar arquivo do storage em caso de erro
      await supabase.storage
        .from('nutritionist-documents')
        .remove([storagePath])

      return NextResponse.json(
        { error: 'Erro ao salvar metadados do documento' },
        { status: 500 }
      )
    }

    // Silent operation - document saved successfully

    return NextResponse.json({
      document: newDoc,
      message:
        documentType === 'crn_proof'
          ? 'Comprovante de CRN enviado com sucesso'
          : 'Certificado enviado com sucesso',
    })
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error)
    // Silent error handling - general upload error
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
