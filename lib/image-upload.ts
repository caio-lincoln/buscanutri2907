import { createSupabaseClient } from './supabase'
import { createClient } from '@supabase/supabase-js'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ProfileImageUploadResult extends UploadResult {
  variants?: {
    original: string
    large?: string
    medium?: string
    small?: string
  }
}

/**
 * Faz upload de uma imagem para o bucket blog-images do Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param userId - ID do usuário que está fazendo o upload
 * @returns Promise com resultado do upload
 */
export async function uploadBlogImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Silent error handling - error getting session
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.',
      }
    }

    if (!session || !session.access_token) {
      // Silent error handling - user not authenticated
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para listar imagens.',
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      // Silent error handling - userId mismatch
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode listar estas imagens.',
      }
    }

    // Criar cliente com service role para contornar RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Listar arquivos do usuário usando service role
    const { data, error } = await serviceSupabase.storage
      .from('blog-images')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      // Silent error handling - error listing images
      return {
        success: false,
        error: 'Erro ao listar imagens.',
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
      images: imageUrls,
    }
  } catch (error) {
    // Silent error handling - unexpected list error
    return {
      success: false,
      error: 'Erro inesperado ao listar imagens.',
    }
  }
}

/**
 * Deleta uma imagem do bucket blog-images
 * @param imageUrl - URL da imagem a ser deletada
 * @param userId - ID do usuário que está deletando
 * @returns Promise com resultado da operação
 */
export async function deleteBlogImage(
  imageUrl: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Silent error handling - error getting session
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.',
      }
    }

    if (!session || !session.access_token) {
      // Silent error handling - user not authenticated
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para fazer upload de imagens.',
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      // Silent error handling - userId mismatch
      return {
        success: false,
        error:
          'Erro de autorização. O usuário não pode fazer upload para esta pasta.',
      }
    }

    // Silent logging - user authenticated and session found

    // Criar FormData para enviar para a API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('accessToken', session.access_token)

    // Silent logging - sending file to upload API

    // Fazer upload através da API route
    const response = await fetch('/api/upload-blog-image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      // Silent error handling - upload API error
      return {
        success: false,
        error: result.error || 'Erro no upload da imagem',
      }
    }

    // Silent logging - upload successful

    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    // Silent error handling - unexpected upload error
    return {
      success: false,
      error: 'Erro inesperado ao fazer upload da imagem.',
    }
  }
}

/**
 * Lista todas as imagens de um usuário no bucket blog-images
 * @param userId - ID do usuário
 * @returns Promise com resultado da operação
 */
export async function listUserBlogImages(
  userId: string
): Promise<{ success: boolean; images?: string[]; error?: string }> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Silent error handling - error getting session
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.',
      }
    }

    if (!session || !session.access_token) {
      // Silent error handling - user not authenticated
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para listar imagens.',
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      // Silent error handling - userId mismatch
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode listar estas imagens.',
      }
    }

    // Criar cliente com service role para contornar RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Listar arquivos do usuário usando service role
    const { data, error } = await serviceSupabase.storage
      .from('blog-images')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      // Silent error handling - error listing images
      return {
        success: false,
        error: 'Erro ao listar imagens.',
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
      images: imageUrls,
    }
  } catch (error) {
    // Silent error handling - unexpected list error
    return {
      success: false,
      error: 'Erro inesperado ao listar imagens.',
    }
  }
}

/**
 * Faz upload de uma imagem de perfil (avatar ou capa) para o Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param userId - ID do usuário que está fazendo o upload
 * @param userType - Tipo do usuário (nutritionist, patient, company)
 * @param imageType - Tipo da imagem (avatar ou cover)
 * @returns Promise com resultado do upload
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  userType: 'nutritionist' | 'patient' | 'company',
  imageType: 'avatar' | 'cover'
): Promise<ProfileImageUploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Silent error handling - error getting session
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.',
      }
    }

    if (!session || !session.access_token) {
      // Silent error handling - user not authenticated
      return {
        success: false,
        error:
          'Usuário não autenticado. Faça login para fazer upload de imagens.',
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      // Silent error handling - userId mismatch
      return {
        success: false,
        error:
          'Erro de autorização. O usuário não pode fazer upload para esta pasta.',
      }
    }

    // Silent logging - user authenticated and session found

    // Criar FormData para enviar para a API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('userType', userType)
    formData.append('imageType', imageType)
    formData.append('accessToken', session.access_token)

    // Silent logging: Sending file to upload API

    // Fazer upload através da API route
    const response = await fetch('/api/upload-profile-image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      // Silent error handling: Upload API error
      return {
        success: false,
        error: result.error || 'Erro no upload da imagem',
      }
    }

    // Silent logging: Upload successful

    return {
      success: true,
      url: result.url,
      variants: result.variants,
    }
  } catch (error) {
    // Silent error handling: Upload error
    return {
      success: false,
      error: 'Erro inesperado ao fazer upload da imagem.',
    }
  }
}

/**
 * Deleta uma imagem de perfil do Supabase Storage
 * @param imageUrl - URL da imagem a ser deletada
 * @param userId - ID do usuário que está deletando
 * @param userType - Tipo do usuário (nutritionist, patient, company)
 * @returns Promise com resultado da operação
 */
export async function deleteProfileImage(
  imageUrl: string,
  userId: string,
  userType: 'nutritionist' | 'patient' | 'company'
): Promise<UploadResult> {
  try {
    // Criar cliente Supabase para verificação de autenticação
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Silent error handling - error getting session
      return {
        success: false,
        error: 'Erro de autenticação. Faça login novamente.',
      }
    }

    if (!session || !session.access_token) {
      // Silent error handling - user not authenticated
      return {
        success: false,
        error: 'Usuário não autenticado. Faça login para excluir imagens.',
      }
    }

    // Verificar se o userId passado corresponde ao usuário autenticado
    if (session.user.id !== userId) {
      // Silent error handling - userId mismatch
      return {
        success: false,
        error: 'Erro de autorização. O usuário não pode excluir esta imagem.',
      }
    }

    // Criar cliente com service role para contornar RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Determinar o bucket baseado no tipo de usuário
    const bucketName =
      userType === 'company'
        ? 'company-assets'
        : userType === 'nutritionist'
          ? 'nutritionist-photos'
          : 'patient-photos'

    // Extrair o nome do arquivo da URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const folderName =
      userType === 'company'
        ? 'logos'
        : userType === 'nutritionist'
          ? 'nutritionist-profiles'
          : 'patient-profiles'
    const filePath = `${folderName}/${fileName}`

    // Excluir o arquivo do Supabase Storage usando service role
    const { error } = await serviceSupabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      // Silent error handling: Image deletion error
      return {
        success: false,
        error: 'Erro ao deletar a imagem.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    // Silent error handling: Image deletion error
    return {
      success: false,
      error: 'Erro inesperado ao deletar a imagem.',
    }
  }
}
