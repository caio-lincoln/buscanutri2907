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
        { success: false, error: 'Configuração do servidor incompleta' },
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
    const userType = formData.get('userType') as string
    const imageType = formData.get('imageType') as string
    const accessToken = formData.get('accessToken') as string

    if (!file || !userId || !userType || !imageType || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se o token de acesso é válido
    const { data: user, error: userError } =
      await supabase.auth.getUser(accessToken)

    if (userError || !user.user || user.user.id !== userId) {
      // Invalid token or unauthorized user - silent error handling
      return NextResponse.json(
        { error: 'Token inválido ou usuário não autorizado' },
        { status: 401 }
      )
    }

    // Validar tipo de arquivo
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

    // Validar tamanho do arquivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Tamanho máximo: 5MB.' },
        { status: 400 }
      )
    }

    // Determinar bucket e pasta baseado no tipo de usuário
    const bucketName =
      userType === 'company'
        ? 'company-assets'
        : userType === 'nutritionist'
          ? 'nutritionist-photos'
          : 'patient-photos'

    const folderName =
      userType === 'company'
        ? 'logos'
        : userType === 'nutritionist'
          ? 'nutritionist-profiles'
          : 'patient-profiles'

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const fileName = `${folderName}/${userId}-${imageType}-${timestamp}-${randomString}.${fileExtension}`

    // Uploading file - silent operation

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      // Upload error - silent error handling
      return NextResponse.json(
        { success: false, error: `Erro no upload: ${error.message}` },
        { status: 500 }
      )
    }

    // Upload successful - silent operation

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    // Public URL generated - silent operation

    // Gerar variantes da imagem (URLs otimizadas)
    const baseUrl = urlData.publicUrl
    const variants = {
      original: baseUrl,
      large:
        imageType === 'cover'
          ? `${baseUrl}?width=2000&height=700&quality=90`
          : `${baseUrl}?width=512&height=512&quality=90`,
      medium:
        imageType === 'cover'
          ? `${baseUrl}?width=1200&height=420&quality=85`
          : `${baseUrl}?width=256&height=256&quality=85`,
      small:
        imageType === 'cover'
          ? `${baseUrl}?width=800&height=280&quality=80`
          : `${baseUrl}?width=96&height=96&quality=80`,
    }

    return NextResponse.json({
      success: true,
      url: baseUrl,
      variants,
    })
  } catch (error) {
    // API upload error - silent error handling
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}
