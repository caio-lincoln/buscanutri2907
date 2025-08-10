import { nutritionistAddressService } from './nutritionist-address-service'

export interface AddressData {
  id?: string
  nutritionist_id?: string
  type: 'in_person' | 'teleconsultation'
  status: 'active' | 'inactive'
  is_main: boolean
  country: string
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

/**
 * Save addresses for a nutritionist after registration
 */
export async function saveNutritionistAddresses(
  nutritionistId: string,
  addresses: AddressData[]
): Promise<void> {
  if (!addresses || addresses.length === 0) {
    return
  }

  try {
    // Save each address
    for (const address of addresses) {
      const addressData = {
        ...address,
        nutritionist_id: nutritionistId,
      }

      await nutritionistAddressService.createAddress(addressData)
    }
  } catch (error) {
    // Silent error handling: Error saving nutritionist addresses
    throw new Error('Erro ao salvar endereços do nutricionista')
  }
}

/**
 * Get addresses for display during registration
 */
export function getAddressDisplayText(address: AddressData): string {
  const parts = []

  if (address.street) {
    parts.push(address.street)
    if (address.number) {
      parts[parts.length - 1] += `, ${address.number}`
    }
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood)
  }

  parts.push(`${address.city}/${address.state}`)

  if (address.zip_code) {
    parts.push(`CEP: ${address.zip_code}`)
  }

  return parts.join(' - ')
}
