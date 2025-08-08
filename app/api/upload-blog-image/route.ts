import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão disponíveis
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variáveis de ambiente não encontradas')
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
          persistSession: false
        }
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
    const { data: user, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user.user || user.user.id !== userId) {
      console.error('Token inválido ou usuário não autorizado:', userError)
      return NextResponse.json(
        { success: false, error: 'Token de acesso inválido ou usuário não autorizado' },
        { status: 401 }
      )
    }

    // Validar tipo de arquivo (incluindo mais formatos WebP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP, AVIF ou GIF.' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (10MB máximo para melhor qualidade)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB.' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

    console.log('Fazendo upload do arquivo:', fileName)

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro no upload:', error)
      return NextResponse.json(
        { success: false, error: `Erro no upload: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Upload realizado com sucesso:', data)

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    console.log('URL pública gerada:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    })

  } catch (error) {
    console.error('Erro na API de upload:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}