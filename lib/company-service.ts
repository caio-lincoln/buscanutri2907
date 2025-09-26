import { createSupabaseClient } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

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
    // Remove campos que não devem ser atualizados
    const dataToUpdate = { ...profileData }
    delete (dataToUpdate as any).id
    delete (dataToUpdate as any).user_id
    delete (dataToUpdate as any).created_at
    delete (dataToUpdate as any).updated_at

    // Usar upsert para criar o registro se não existir
    const { data, error } = await supabase
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
    const fileExt = file.name.split('.').pop()
    const fileName = `company-logo-${userId}-${Date.now()}.${fileExt}`
    const filePath = `company-logos/${fileName}`

    const { data, error } = await supabase.storage
      .from('company-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro ao fazer upload do logo:', error)
      throw new Error(`Erro ao fazer upload: ${error.message}`)
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath)

    return publicUrl
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