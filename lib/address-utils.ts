import { nutritionistAddressService } from './nutritionist-address-service'

export interface AddressData {
  id?: string | undefined
  nutritionist_id?: string | undefined
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
