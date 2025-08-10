import { supabase } from './supabase'
import type { Database } from './supabase'

export type Badge = Database['public']['Tables']['badges']['Row']
export type NutritionistBadge =
  Database['public']['Tables']['user_badges']['Row'] & {
    badge?: Badge // Para incluir os detalhes da insígnia
  }

// Funções para gerenciar insígnias (admin)
export async function createBadge(
  name: string,
  description: string,
  icon_url: string
): Promise<Badge | null> {
  const { data, error } = await supabase
    .from('badges')
    .insert({ name, description, icon_url })
    .select()
    .single()
  if (error) {
    // Silent error handling: Error creating badge
    return null
  }
  return data
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
  const { data, error } = await supabase
    .from('badges')
    .update({ name, description, icon_url })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    // Silent error handling: Error updating badge
    return null
  }
  return data
}

export async function deleteBadge(id: string): Promise<boolean> {
  const { error } = await supabase.from('badges').delete().eq('id', id)
  if (error) {
    // Silent error handling: Error deleting badge
    return false
  }
  return true
}

// Funções para atribuir/remover insígnias de nutricionistas (admin)
export async function assignBadgeToNutritionist(
  nutritionistId: string,
  badgeId: string,
  assignedByUserId: string
): Promise<NutritionistBadge | null> {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({ user_id: nutritionistId, badge_id: badgeId })
    .select()
    .single()
  if (error) {
    // Silent error handling: Error assigning badge to nutritionist
    return null
  }
  return data
}

export async function removeBadgeFromNutritionist(
  nutritionistId: string,
  badgeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_badges')
    .delete()
    .eq('user_id', nutritionistId)
    .eq('badge_id', badgeId)
  if (error) {
    // Silent error handling: Error removing badge from nutritionist
    return false
  }
  return true
}

export async function getNutritionistBadges(
  nutritionistId: string
): Promise<NutritionistBadge[]> {
  try {
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', nutritionistId)

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

    if (!userBadges || userBadges.length === 0) {
      return []
    }

    // Buscar informações das badges separadamente
    const badgeIds = userBadges.map(ub => ub.badge_id)
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .in('id', badgeIds)

    if (badgesError) {
      // Silent error handling: Error fetching badge details
      return userBadges.map(ub => ({ ...ub, badge: undefined }))
    }

    // Mapear os dados para incluir a badge corretamente
    const mappedData = userBadges.map(item => ({
      ...item,
      badge: badges?.find(badge => badge.id === item.badge_id),
    }))

    return mappedData as NutritionistBadge[]
  } catch (error) {
    // Silent warning: Error accessing badge tables
    return []
  }
}
