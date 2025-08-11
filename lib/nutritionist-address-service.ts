import { supabase } from './supabase'
import type { NutritionistAddress } from './supabase'

export interface CreateAddressData {
  nutritionist_id: string
  type: 'in_person' | 'teleconsultation'
  status?: 'active' | 'inactive'
  is_main?: boolean
  country?: string
  state: string
  city: string
  neighborhood?: string
  zip_code?: string
  street?: string
  number?: string
  complement?: string
  latitude?: number
  longitude?: number
  service_radius_km?: number
}

export interface UpdateAddressData {
  type?: 'in_person' | 'teleconsultation'
  status?: 'active' | 'inactive'
  is_main?: boolean
  country?: string
  state?: string
  city?: string
  neighborhood?: string
  zip_code?: string
  street?: string
  number?: string
  complement?: string
  latitude?: number
  longitude?: number
  service_radius_km?: number
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
