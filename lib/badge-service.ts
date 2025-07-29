import { supabase } from "./supabase"
import type { Database } from "./database.types"

export type Badge = Database["public"]["Tables"]["badges"]["Row"]
export type NutritionistBadge = Database["public"]["Tables"]["nutritionist_badges"]["Row"] & {
  badge?: Badge // Para incluir os detalhes da insígnia
}

// Funções para gerenciar insígnias (admin)
export async function createBadge(name: string, description: string, icon_url: string): Promise<Badge | null> {
  const { data, error } = await supabase.from("badges").insert({ name, description, icon_url }).select().single()
  if (error) {
    console.error("Erro ao criar insígnia:", error)
    return null
  }
  return data
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.from("badges").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Erro ao buscar todas as insígnias:", error)
    return []
  }
  return data
}

export async function updateBadge(
  id: string,
  name: string,
  description: string,
  icon_url: string,
): Promise<Badge | null> {
  const { data, error } = await supabase
    .from("badges")
    .update({ name, description, icon_url })
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("Erro ao atualizar insígnia:", error)
    return null
  }
  return data
}

export async function deleteBadge(id: string): Promise<boolean> {
  const { error } = await supabase.from("badges").delete().eq("id", id)
  if (error) {
    console.error("Erro ao deletar insígnia:", error)
    return false
  }
  return true
}

// Funções para atribuir/remover insígnias de nutricionistas (admin)
export async function assignBadgeToNutritionist(
  nutritionistId: string,
  badgeId: string,
  assignedByUserId: string,
): Promise<NutritionistBadge | null> {
  const { data, error } = await supabase
    .from("nutritionist_badges")
    .insert({ nutritionist_id: nutritionistId, badge_id: badgeId, assigned_by_user_id: assignedByUserId })
    .select()
    .single()
  if (error) {
    console.error("Erro ao atribuir insígnia ao nutricionista:", error)
    return null
  }
  return data
}

export async function removeBadgeFromNutritionist(nutritionistId: string, badgeId: string): Promise<boolean> {
  const { error } = await supabase
    .from("nutritionist_badges")
    .delete()
    .eq("nutritionist_id", nutritionistId)
    .eq("badge_id", badgeId)
  if (error) {
    console.error("Erro ao remover insígnia do nutricionista:", error)
    return false
  }
  return true
}

export async function getNutritionistBadges(nutritionistId: string): Promise<NutritionistBadge[]> {
  try {
    const { data, error } = await supabase
      .from("nutritionist_badges")
      .select(
        `
        *,
        badges!inner(*)
      `,
      )
      .eq("nutritionist_id", nutritionistId)
    
    if (error) {
      // Se o erro for relacionado a tabelas não encontradas, retornar array vazio silenciosamente
      if (error.code === 'PGRST200' || error.message.includes('relationship') || error.message.includes('not found')) {
        console.warn("⚠️ Tabelas de badges não configuradas ainda. Execute o setup das tabelas.");
        return [];
      }
      console.error("Erro ao buscar insígnias do nutricionista:", error)
      return []
    }
    
    // Mapear os dados para incluir a badge corretamente
    const mappedData = data?.map(item => ({
      ...item,
      badge: item.badges
    })) || []
    
    return mappedData as NutritionistBadge[]
  } catch (error) {
    console.warn("⚠️ Erro ao acessar tabelas de badges:", error);
    return [];
  }
}
