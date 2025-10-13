import { createSupabaseClient } from './supabase'

// Use o cliente autenticado (browser) para garantir sessão consistente
const supabase = createSupabaseClient()

// Novos tipos conforme especificação
export type ServiceType = 'presencial' | 'online' | 'hibrido'
export type AddressStatus = 'ativo' | 'inativo'

export type NutritionistAddress = {
  id: string
  nutritionist_id: string
  service_type: ServiceType
  status: AddressStatus
  is_primary: boolean
  cep?: string | null
  state?: string | null
  city?: string | null
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  complement?: string | null
  radius_km?: number | undefined
  created_at?: string
  updated_at?: string
}

export interface CreateAddressData {
  nutritionist_id: string
  type: 'in_person' | 'teleconsultation'
  status?: 'active' | 'inactive' | undefined
  is_main?: boolean | undefined
  country?: string | undefined
  state: string
  city: string
  neighborhood?: string | undefined
  zip_code?: string | undefined
  street?: string | undefined
  number?: string | undefined
  complement?: string | undefined
  latitude?: number | undefined
  longitude?: number | undefined
  service_radius_km?: number | undefined
}

export interface UpdateAddressData {
  type?: 'in_person' | 'teleconsultation' | undefined
  status?: 'active' | 'inactive' | undefined
  is_main?: boolean | undefined
  country?: string | undefined
  state?: string | undefined
  city?: string | undefined
  neighborhood?: string | undefined
  zip_code?: string | undefined
  street?: string | undefined
  number?: string | undefined
  complement?: string | undefined
  latitude?: number | undefined
  longitude?: number | undefined
  service_radius_km?: number | undefined
}

export interface AddressFilters {
  nutritionist_id?: string
  type?: 'in_person' | 'teleconsultation'
  status?: 'active' | 'inactive'
  city_slug?: string
  state?: string
  city?: string
}

export interface CityOption {
  city: string
  state: string
  city_slug: string
  display_name: string // "City/State" format
  nutritionist_count: number
}

class NutritionistAddressService {
  /**
   * Create a new address for a nutritionist
   */
  async createAddress(data: CreateAddressData): Promise<NutritionistAddress> {
    const { data: address, error } = await supabase
      .from('nutritionist_addresses')
      .insert({
        nutritionist_id: data.nutritionist_id,
        type: data.type,
        status: data.status || 'active',
        is_main: data.is_main || false,
        country: data.country || 'Brasil',
        state: data.state,
        city: data.city,
        neighborhood: data.neighborhood,
        zip_code: data.zip_code,
        street: data.street,
        number: data.number,
        complement: data.complement,
        latitude: data.latitude,
        longitude: data.longitude,
        service_radius_km: data.service_radius_km,
      })
      .select()
      .single()
    console.log("🚀 ~ NutritionistAddressService ~ createAddress ~ address:", address)
    console.log("🚀 ~ NutritionistAddressService ~ createAddress ~ error:", error)

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`)
    }

    return address
  }

  /**
   * Get all addresses for a nutritionist
   */
  async getAddressesByNutritionist(
    nutritionist_id: string,
    filters?: Omit<AddressFilters, 'nutritionist_id'>
  ): Promise<NutritionistAddress[]> {
    let query = supabase
      .from('nutritionist_addresses')
      .select('*')
      .eq('nutritionist_id', nutritionist_id)
      .order('is_main', { ascending: false })
      .order('created_at', { ascending: true })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch addresses: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(id: string): Promise<NutritionistAddress | null> {
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Address not found
      }
      throw new Error(`Failed to fetch address: ${error.message}`)
    }

    return data
  }

  /**
   * Update an address
   */
  async updateAddress(
    id: string,
    data: UpdateAddressData
  ): Promise<NutritionistAddress> {
    const { data: address, error } = await supabase
      .from('nutritionist_addresses')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`)
    }

    return address
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('nutritionist_addresses')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`)
    }
  }

  /**
   * Set an address as the main address for a nutritionist
   */
  async setMainAddress(id: string): Promise<NutritionistAddress> {
    const { data: address, error } = await supabase
      .from('nutritionist_addresses')
      .update({ is_main: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to set main address: ${error.message}`)
    }

    return address
  }

  /**
   * Get the main address for a nutritionist
   */
  async getMainAddress(
    nutritionist_id: string
  ): Promise<NutritionistAddress | null> {
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .select('*')
      .eq('nutritionist_id', nutritionist_id)
      .eq('is_main', true)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No main address found
      }
      throw new Error(`Failed to fetch main address: ${error.message}`)
    }

    return data
  }

  /**
   * Get main addresses for multiple nutritionists in a single query
   */
  async getMainAddressesByNutritionistIds(
    nutritionistIds: string[]
  ): Promise<NutritionistAddress[]> {
    if (!nutritionistIds || nutritionistIds.length === 0) return []

    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .select('*')
      .in('nutritionist_id', nutritionistIds)
      .eq('is_main', true)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch main addresses: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all unique cities where nutritionists provide in-person services
   * Used for city filter in search
   */
  async getAvailableCities(): Promise<CityOption[]> {
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .select('city, state, city_slug')
      .eq('type', 'in_person')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch available cities: ${error.message}`)
    }

    if (!data) return []

    // Group by city_slug and count nutritionists
    const cityMap = new Map<string, CityOption>()

    for (const address of data) {
      const key = address.city_slug
      if (cityMap.has(key)) {
        cityMap.get(key)!.nutritionist_count++
      } else {
        cityMap.set(key, {
          city: address.city,
          state: address.state,
          city_slug: address.city_slug,
          display_name: `${address.city}/${address.state}`,
          nutritionist_count: 1,
        })
      }
    }

    // Convert to array and sort by nutritionist count (descending) then by city name
    return Array.from(cityMap.values()).sort((a, b) => {
      if (a.nutritionist_count !== b.nutritionist_count) {
        return b.nutritionist_count - a.nutritionist_count
      }
      return a.display_name.localeCompare(b.display_name)
    })
  }

  /**
   * Search nutritionists by location with optional radius
   */
  async searchNutritionistsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<NutritionistAddress[]> {
    // Using PostGIS distance calculation
    const { data, error } = await supabase.rpc(
      'search_nutritionists_by_location',
      {
        search_lat: latitude,
        search_lng: longitude,
        radius_km: radiusKm,
      }
    )

    if (error) {
      throw new Error(`Failed to search by location: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get addresses by city slug (for filtering)
   */
  async getAddressesByCitySlug(
    city_slug: string
  ): Promise<NutritionistAddress[]> {
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .select('*')
      .eq('city_slug', city_slug)
      .eq('type', 'in_person')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch addresses by city: ${error.message}`)
    }

    return data || []
  }

  /**
   * Validate address data before saving
   */
  validateAddressData(data: CreateAddressData | UpdateAddressData): string[] {
    const errors: string[] = []

    if ('state' in data && !data.state?.trim()) {
      errors.push('Estado é obrigatório')
    }

    if ('city' in data && !data.city?.trim()) {
      errors.push('Cidade é obrigatória')
    }

    if ('zip_code' in data && data.zip_code) {
      const zipRegex = /^d{5}-?d{3}$/
      if (!zipRegex.test(data.zip_code)) {
        errors.push('CEP deve estar no formato 00000-000')
      }
    }

    if ('latitude' in data && data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        errors.push('Latitude deve estar entre -90 e 90')
      }
    }

    if ('longitude' in data && data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        errors.push('Longitude deve estar entre -180 e 180')
      }
    }

    if ('service_radius_km' in data && data.service_radius_km !== undefined) {
      if (data.service_radius_km < 0 || data.service_radius_km > 500) {
        errors.push('Raio de atendimento deve estar entre 0 e 500 km')
      }
    }

    return errors
  }
}

export const nutritionistAddressService = new NutritionistAddressService()

// Novas funções para o modal
export async function listMyAddresses(nutritionistId: string): Promise<NutritionistAddress[]> {
  const { data, error } = await supabase
    .from('nutritionist_addresses')
    .select('*')
    .eq('nutritionist_id', nutritionistId)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch addresses: ${error.message}`)
  }

  // Mapear os dados existentes para o novo formato
  return (data || []).map(address => ({
    id: address.id,
    nutritionist_id: address.nutritionist_id,
    service_type: address.type === 'in_person' ? 'presencial' : 
                  address.type === 'teleconsultation' ? 'online' : 'hibrido',
    status: address.status === 'active' ? 'ativo' : 'inativo',
    is_primary: address.is_main || false,
    cep: address.zip_code,
    state: address.state,
    city: address.city,
    street: address.street,
    number: address.number,
    neighborhood: address.neighborhood,
    complement: address.complement,
    radius_km: address.service_radius_km,
    created_at: address.created_at,
    updated_at: address.updated_at,
  }))
}

export async function upsertMyAddress(address: Partial<NutritionistAddress> & { nutritionist_id: string }) {
  // Mapear do novo formato para o formato do banco
  const dbAddress = {
    nutritionist_id: address.nutritionist_id,
    type: address.service_type === 'presencial' ? 'in_person' as const :
          address.service_type === 'online' ? 'teleconsultation' as const : 'in_person' as const,
    status: address.status === 'ativo' ? 'active' as const : 'inactive' as const,
    is_main: address.is_primary || false,
    zip_code: address.cep,
    state: address.state,
    city: address.city,
    street: address.street,
    number: address.number,
    neighborhood: address.neighborhood,
    complement: address.complement,
    service_radius_km: address.radius_km !== undefined && address.radius_km !== null
      ? Number(address.radius_km)
      : undefined,
    country: 'Brasil',
  }

  if (address.id) {
    // Update existing
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .update(dbAddress)
      .eq('id', address.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar endereço', {
        payload: { id: address.id, ...dbAddress },
        error: { message: error.message, code: (error as any)?.code },
      })
      throw new Error(`Failed to update address: ${error.message}`)
    }
    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('nutritionist_addresses')
      .insert(dbAddress)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar endereço', {
        payload: dbAddress,
        error: { message: error.message, code: (error as any)?.code },
      })
      throw new Error(`Failed to create address: ${error.message}`)
    }
    return data
  }
}

export async function deleteMyAddress(id: string) {
  const { error } = await supabase
    .from('nutritionist_addresses')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete address: ${error.message}`)
  }
}

export async function setPrimaryAddress(nutritionistId: string, id: string) {
  // Zerar outras como principais
  await supabase
    .from('nutritionist_addresses')
    .update({ is_main: false })
    .eq('nutritionist_id', nutritionistId)

  // Definir a selecionada como principal
  const { error } = await supabase
    .from('nutritionist_addresses')
    .update({ is_main: true })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to set primary address: ${error.message}`)
  }
}
