// Serviço de API para badges que funciona no lado cliente
export type Badge = {
  id: string
  name: string
  description: string
  icon_url: string
  created_at: string
}

export type NutritionistBadge = {
  id: string
  awarded_at: string
  awarded_by: string | null
  notes: string | null
  badge: Badge
}

// Buscar todas as badges
export async function getAllBadges(): Promise<Badge[]> {
  try {
    const response = await fetch('/api/admin/badges')
    if (!response.ok) {
      throw new Error('Erro ao buscar badges')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching badges:', error)
    return []
  }
}

// Criar nova badge
export async function createBadge(
  name: string,
  description: string,
  icon_url: string
): Promise<Badge | null> {
  try {
    const response = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, icon_url }),
    })
    
    if (!response.ok) {
      throw new Error('Erro ao criar badge')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating badge:', error)
    return null
  }
}

// Atualizar badge
export async function updateBadge(
  id: string,
  name: string,
  description: string,
  icon_url: string
): Promise<Badge | null> {
  try {
    const response = await fetch('/api/admin/badges', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, name, description, icon_url }),
    })
    
    if (!response.ok) {
      throw new Error('Erro ao atualizar badge')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating badge:', error)
    return null
  }
}

// Deletar badge
export async function deleteBadge(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/badges?id=${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Erro ao deletar badge')
    }
    
    return true
  } catch (error) {
    console.error('Error deleting badge:', error)
    return false
  }
}

// Atribuir badge a nutricionista
export async function assignBadgeToNutritionist(
  badgeId: string,
  nutritionistId: string,
  adminUserId: string
): Promise<any> {
  try {
    const response = await fetch('/api/admin/badges/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ badgeId, nutritionistId, adminUserId }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atribuir badge')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error assigning badge:', error)
    throw error
  }
}

// Remover badge de nutricionista
export async function removeBadgeFromNutritionist(
  badgeId: string,
  nutritionistId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/badges/assign', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ badgeId, nutritionistId }),
    })
    
    if (!response.ok) {
      throw new Error('Erro ao remover badge')
    }
    
    return true
  } catch (error) {
    console.error('Error removing badge:', error)
    return false
  }
}

// Buscar badges de um nutricionista
export async function getNutritionistBadges(nutritionistId: string): Promise<NutritionistBadge[]> {
  try {
    const response = await fetch(`/api/admin/badges/nutritionist/${nutritionistId}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar badges do nutricionista')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching nutritionist badges:', error)
    return []
  }
}