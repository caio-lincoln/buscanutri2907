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

// Função auxiliar para adicionar autorização de produção
function addProductionAuth(headers: Record<string, string> = {}, body?: any) {
  // Adicionar header de autorização de produção
  const authHeaders = {
    ...headers,
    'x-production-auth': 'liberar_producao'
  }
  
  // Se há body, adicionar campo de autorização também
  if (body && typeof body === 'object') {
    body.production_auth = 'liberar_producao'
  }
  
  return { headers: authHeaders, body }
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
    const requestBody = { name, description, icon_url }
    const { headers, body } = addProductionAuth(
      { 'Content-Type': 'application/json' },
      requestBody
    )
    
    const response = await fetch('/api/admin/badges', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao criar badge')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating badge:', error)
    throw error
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
    const requestBody = { id, name, description, icon_url }
    const { headers, body } = addProductionAuth(
      { 'Content-Type': 'application/json' },
      requestBody
    )
    
    const response = await fetch('/api/admin/badges', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atualizar badge')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating badge:', error)
    throw error
  }
}

// Deletar badge
export async function deleteBadge(id: string): Promise<boolean> {
  try {
    const { headers } = addProductionAuth()
    
    const response = await fetch(`/api/admin/badges?id=${id}`, {
      method: 'DELETE',
      headers,
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao deletar badge')
    }
    
    return true
  } catch (error) {
    console.error('Error deleting badge:', error)
    throw error
  }
}

// Atribuir badge a nutricionista
export async function assignBadgeToNutritionist(
  badgeId: string,
  nutritionistId: string,
  adminUserId: string
): Promise<any> {
  try {
    const requestBody = { badgeId, nutritionistId, adminUserId }
    const { headers, body } = addProductionAuth(
      { 'Content-Type': 'application/json' },
      requestBody
    )
    
    const response = await fetch('/api/admin/badges/assign', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
  nutritionistId: string,
  badgeId: string
): Promise<boolean> {
  try {
    const requestBody = { badgeId, nutritionistId }
    const { headers, body } = addProductionAuth(
      { 'Content-Type': 'application/json' },
      requestBody
    )
    
    const response = await fetch('/api/admin/badges/assign', {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao remover badge')
    }
    
    return true
  } catch (error) {
    console.error('Error removing badge:', error)
    throw error
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