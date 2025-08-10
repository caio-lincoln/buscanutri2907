import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão disponíveis
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      // Environment variables not found - silent error handling
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Obter dados do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const accessToken = formData.get('accessToken') as string

    if (!file || !userId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se o token de acesso é válido
    const { data: user, error: userError } =
      await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      // Invalid token or unauthorized user - silent error handling
      return NextResponse.json(
        { error: 'Token inválido ou usuário não autorizado' },
        { status: 401 }
      )
    }

    // Validar tipo de arquivo (incluindo mais formatos WebP)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tipo de arquivo não permitido. Use JPEG, PNG, WebP, AVIF ou GIF.',
        },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (10MB máximo para melhor qualidade)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo muito grande. Tamanho máximo: 10MB.',
        },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

    // Silent upload process

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      // Upload error - silent error handling
      return NextResponse.json(
        { error: 'Erro no upload da imagem' },
        { status: 500 }
      )
    }

    // Upload successful - silent operation
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    // Public URL generated - silent operation
    return NextResponse.json({
      url: urlData.publicUrl,
      fileName,
    })
  } catch (error) {
    // API upload error - silent error handling
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
