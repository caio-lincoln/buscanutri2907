import { createSupabaseClient } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { uploadProfileImage } from '@/lib/image-upload'

// Re-export CompanyProfile type from supabase.ts
export type { CompanyProfile } from '@/lib/supabase'

/**
 * Atualiza o perfil de uma empresa
 */
export async function updateCompanyProfile(
  userId: string,
  profileData: Partial<{
    company_name: string
    cnpj: string
    description: string
    logo_url: string
    website: string
    company_size: string
    industry: string
    address: string
    phone: string
    responsible_name: string
    responsible_position: string
    responsible_cpf: string
  }>
) {
  try {
    // Validar sessão e usuário
    const sb = createSupabaseClient()
    const { data: { session }, error: sessionError } = await sb.auth.getSession()
    if (sessionError) {
      throw new Error('Erro de autenticação. Faça login novamente.')
    }
    if (!session || !session.user) {
      throw new Error('Usuário não autenticado.')
    }
    if (session.user.id !== userId) {
      throw new Error('Usuário diferente do perfil alvo.')
    }

    // Remove campos que não devem ser atualizados
    const dataToUpdate = { ...profileData }
    delete (dataToUpdate as any).id
    delete (dataToUpdate as any).user_id
    delete (dataToUpdate as any).created_at
    delete (dataToUpdate as any).updated_at

    // Usar upsert para criar o registro se não existir
    const { data, error } = await sb
      .from('company_profiles')
      .upsert(
        { 
          user_id: userId,
          ...dataToUpdate 
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil da empresa:', error)
      throw new Error(`Erro ao atualizar perfil: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Erro na função updateCompanyProfile:', error)
    throw error
  }
}

/**
 * Faz upload do logo da empresa
 */
export async function uploadCompanyLogo(file: File, userId: string): Promise<string> {
  try {
    // Usar o cliente de navegador para garantir sessão válida
    const sb = createSupabaseClient()
    const { data: { session }, error: sessionError } = await sb.auth.getSession()
    if (sessionError) {
      throw new Error('Erro de autenticação. Faça login novamente.')
    }
    if (!session || !session.user) {
      throw new Error('Usuário não autenticado.')
    }
    if (session.user.id !== userId) {
      throw new Error('Usuário diferente do perfil alvo.')
    }

    // Verificar existência do perfil de empresa antes do upload
    const { data: existingProfile, error: existingError } = await sb
      .from('company_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      console.error('Erro ao verificar perfil da empresa:', existingError)
      throw new Error('Falha ao verificar perfil da empresa antes do upload.')
    }
    if (!existingProfile) {
      throw new Error('Perfil da empresa não encontrado. Salve os dados básicos antes do upload do logo.')
    }

    // Utilizar a rota de API de upload com service role para evitar falhas de RLS
    const result = await uploadProfileImage(file, userId, 'company', 'avatar')

    if (!result.success || !result.url) {
      const message = result.error || 'Erro ao fazer upload do logo.'
      console.error('Erro ao fazer upload do logo via API:', message)
      throw new Error(`Erro ao fazer upload: ${message}`)
    }

    return result.url
  } catch (error: any) {
    console.error('Erro na função uploadCompanyLogo:', error)
    throw error
  }
}

/**
 * Obtém todas as vagas ativas
 */
export async function getAllActiveJobs() {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar vagas:', error)
      throw new Error(`Erro ao buscar vagas: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Erro na função getAllActiveJobs:', error)
    throw error
  }
}

// Re-export JobPosting type from supabase.ts
export type { JobPosting } from '@/lib/supabase'
