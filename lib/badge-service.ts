import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Cliente administrativo para operações que precisam contornar RLS
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration:', {
      url: !!supabaseUrl,
      key: !!supabaseKey,
      env: process.env.NODE_ENV
    })
    throw new Error(`Missing Supabase configuration: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`)
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export type Badge = Database['public']['Tables']['badges']['Row']
export type NutritionistBadge =
  Database['public']['Tables']['nutritionist_badges']['Row'] & {
    badge?: Badge // Para incluir os detalhes da insígnia
  }

// Funções para gerenciar insígnias (admin)
export async function createBadge(
  name: string,
  description: string,
  icon_url: string
): Promise<Badge | null> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('badges')
      .insert({ name, description, icon_url })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating badge:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error in createBadge:', error)
    return null
  }
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('name', { ascending: true })
  if (error) {
    // Silent error handling: Error fetching all badges
    return []
  }
  return data
}

export async function updateBadge(
  id: string,
  name: string,
  description: string,
  icon_url: string
): Promise<Badge | null> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('badges')
      .update({ name, description, icon_url })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating badge:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error in updateBadge:', error)
    return null
  }
}

export async function deleteBadge(id: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('badges').delete().eq('id', id)
    
    if (error) {
      console.error('Error deleting badge:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error in deleteBadge:', error)
    return false
  }
}

// Funções para atribuir/remover insígnias de nutricionistas (admin)
export async function assignBadgeToNutritionist(
  badgeId: string,
  nutritionistId: string,
  adminUserId: string
) {
  try {
    console.log('Attempting to assign badge:', { badgeId, nutritionistId, adminUserId })

    // Criar cliente administrativo para bypass do RLS
    const adminClient = createAdminClient()

    // Verificar se o adminUserId foi fornecido
    if (!adminUserId) {
      console.error('Admin user ID not provided')
      throw new Error('Erro de autenticação: ID do administrador não fornecido!')
    }

    // Verificar se o usuário fornecido é admin
    const { data: adminUser, error: adminError } = await adminClient
      .from('users')
      .select('id, user_type')
      .eq('id', adminUserId)
      .single()

    if (adminError) {
      console.error('Error fetching admin user:', adminError)
      throw new Error(`Erro ao verificar usuário admin: ${adminError.message}`)
    }

    if (!adminUser || adminUser.user_type !== 'admin') {
      console.error('User is not admin:', adminUser)
      throw new Error('Usuário não é administrador')
    }

    console.log('Admin user verified:', adminUser)

    // Verificar se a atribuição já existe
    const { data: existingAssignment, error: checkError } = await adminClient
      .from('nutritionist_badges')
      .select('id')
      .eq('nutritionist_id', nutritionistId)
      .eq('badge_id', badgeId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', checkError)
      throw new Error(`Erro ao verificar atribuição existente: ${checkError.message}`)
    }

    if (existingAssignment) {
      console.log('Badge already assigned to nutritionist')
      throw new Error('Esta insígnia já foi atribuída a este nutricionista')
    }

    // Inserir nova atribuição usando cliente administrativo
    const { data, error } = await adminClient
      .from('nutritionist_badges')
      .insert({
        nutritionist_id: nutritionistId,
        badge_id: badgeId,
        awarded_by: adminUserId, // Usar o ID do admin fornecido
      })
      .select()

    if (error) {
      console.error('Error assigning badge:', error)
      throw new Error(`Erro ao atribuir insígnia: ${error.message}`)
    }

    console.log('Badge assigned successfully:', data)
    return data
  } catch (error) {
    console.error('Error in assignBadgeToNutritionist:', error)
    throw error
  }
}

export async function removeBadgeFromNutritionist(
  nutritionistId: string,
  badgeId: string
): Promise<boolean> {
  try {
    // Usar cliente administrativo para operações de remoção
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from('nutritionist_badges')
      .delete()
      .eq('nutritionist_id', nutritionistId)
      .eq('badge_id', badgeId)
    
    if (error) {
      console.error('Error removing badge from nutritionist:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error in removeBadgeFromNutritionist:', error)
    return false
  }
}

export async function getNutritionistBadges(
  nutritionistId: string
): Promise<NutritionistBadge[]> {
  try {
    const { data: nutritionistBadges, error } = await supabase
      .from('nutritionist_badges')
      .select('*')
      .eq('nutritionist_id', nutritionistId)

    if (error) {
      // Se o erro for relacionado a tabelas não encontradas, retornar array vazio silenciosamente
      if (
        error.code === 'PGRST200' ||
        error.message.includes('relationship') ||
        error.message.includes('not found')
      ) {
        // Silent warning: Badge tables not configured yet
        return []
      }
      // Silent error handling: Error fetching nutritionist badges
      return []
    }

    if (!nutritionistBadges || nutritionistBadges.length === 0) {
      return []
    }

    // Buscar informações das badges separadamente
    const badgeIds = nutritionistBadges.map(nb => nb.badge_id)
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .in('id', badgeIds)

    if (badgesError) {
      // Silent error handling: Error fetching badge details
      return nutritionistBadges.map(nb => ({ ...nb, badge: undefined }))
    }

    // Mapear os dados para incluir a badge corretamente
    const mappedData = nutritionistBadges.map(item => ({
      ...item,
      badge: badges?.find(badge => badge.id === item.badge_id),
    }))

    return mappedData as NutritionistBadge[]
  } catch (error) {
    // Silent warning: Error accessing badge tables
    return []
  }
}
