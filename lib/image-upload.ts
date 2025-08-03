import { createSupabaseClient } from './supabase'
import { createClient } from '@supabase/supabase-js'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Faz upload de uma imagem para o bucket blog-images do Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param userId - ID do usuário que está fazendo o upload
 * @returns Promise com resultado do upload
 */
export async function uploadBlogImage(file: File, userId: string): Promise<UploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()
    
    // Verificar se o usuário está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError)
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.'
      }
    }
    
    if (!session || !session.access_token) {
      console.error('Usuário não autenticado ou token ausente')
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para fazer upload de imagens.'
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      console.error('UserId não corresponde ao usuário autenticado:', {
        sessionUserId: session.user.id,
        providedUserId: userId
      })
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode fazer upload para esta pasta.'
      }
    }

    console.log('Usuário autenticado:', userId)
    console.log('Sessão encontrada, access_token length:', session.access_token?.length || 0)

    // Criar FormData para enviar para a API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('accessToken', session.access_token)

    console.log('Enviando arquivo para API de upload:', file.name)

    // Fazer upload através da API route
    const response = await fetch('/api/upload-blog-image', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error('Erro na API de upload:', result.error)
      return {
        success: false,
        error: result.error || 'Erro no upload da imagem'
      }
    }

    console.log('Upload realizado com sucesso:', result.url)

    return {
      success: true,
      url: result.url
    }

  } catch (error) {
    console.error('Erro no upload:', error)
    return {
      success: false,
      error: 'Erro inesperado ao fazer upload da imagem.'
    }
  }
}

/**
 * Deleta uma imagem do bucket blog-images
 * @param imageUrl - URL da imagem a ser deletada
 * @param userId - ID do usuário que está deletando
 * @returns Promise com resultado da operação
 */
export async function deleteBlogImage(imageUrl: string, userId: string): Promise<UploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()
    
    // Verificar se o usuário está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError)
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.'
      }
    }
    
    if (!session || !session.access_token) {
      console.error('Usuário não autenticado ou token ausente')
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para excluir imagens.'
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      console.error('UserId não corresponde ao usuário autenticado:', {
        sessionUserId: session.user.id,
        providedUserId: userId
      })
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode excluir esta imagem.'
      }
    }

    // Criar cliente com service role para contornar RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Extrair o nome do arquivo da URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${userId}/${fileName}`

    // Excluir o arquivo do Supabase Storage usando service role
    const { error } = await serviceSupabase.storage
      .from('blog-images')
      .remove([filePath])

    if (error) {
      console.error('Erro ao deletar imagem:', error)
      return {
        success: false,
        error: 'Erro ao deletar a imagem.'
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Erro ao deletar imagem:', error)
    return {
      success: false,
      error: 'Erro inesperado ao deletar a imagem.'
    }
  }
}

/**
 * Lista todas as imagens de um usuário no bucket blog-images
 * @param userId - ID do usuário
 * @returns Promise com resultado da operação
 */
export async function listUserBlogImages(userId: string): Promise<{ success: boolean; images?: string[]; error?: string }> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()
    
    // Verificar se o usuário está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError)
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.'
      }
    }
    
    if (!session || !session.access_token) {
      console.error('Usuário não autenticado ou token ausente')
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para listar imagens.'
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      console.error('UserId não corresponde ao usuário autenticado:', {
        sessionUserId: session.user.id,
        providedUserId: userId
      })
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode listar estas imagens.'
      }
    }

    // Criar cliente com service role para contornar RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Listar arquivos do usuário usando service role
    const { data, error } = await serviceSupabase.storage
      .from('blog-images')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Erro ao listar imagens:', error)
      return {
        success: false,
        error: 'Erro ao listar imagens.'
      }
    }

    // Converter para URLs públicas
    const imageUrls = data.map(file => {
      const { data: urlData } = serviceSupabase.storage
        .from('blog-images')
        .getPublicUrl(`${userId}/${file.name}`)
      return urlData.publicUrl
    })

    return {
      success: true,
      images: imageUrls
    }

  } catch (error) {
    console.error('Erro ao listar imagens:', error)
    return {
      success: false,
      error: 'Erro inesperado ao listar imagens.'
    }
  }
}