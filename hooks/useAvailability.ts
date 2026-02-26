
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { addDays, format, isValid } from 'date-fns'

export interface AvailableSlot {
  datetime: string
  date: string
  time: string
  duration: number
  available: boolean
  is_past?: boolean
  has_collision?: boolean
}

interface UseAvailabilityProps {
  nutritionistId: string
  startDate?: string
  endDate?: string
}

export function useAvailability({ nutritionistId, startDate, endDate }: UseAvailabilityProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Frontend availability logic override (as implemented previously)
  const isSlotAvailableOverride = useCallback((slotISO: string) => {
    try {
      const timezone = "America/Sao_Paulo"
      const nowLocal = new Date(
        new Date().toLocaleString("en-US", { timeZone: timezone })
      )
      const slotLocal = new Date(
        new Date(slotISO).toLocaleString("en-US", { timeZone: timezone })
      )
      return slotLocal > nowLocal
    } catch (e) {
      return new Date(slotISO) > new Date()
    }
  }, [])

  const fetchAvailability = useCallback(async (start?: string, end?: string) => {
    if (!nutritionistId) return

    setLoading(true)
    setError(null)
    
    try {
      // Default to today and +14 days if not provided
      const startParam = start || startDate || new Date().toISOString()
      const endParam = end || endDate || addDays(new Date(), 14).toISOString()

      const queryParams = new URLSearchParams({
        start: startParam,
        end: endParam
      })

      const url = `/api/nutritionists/${nutritionistId}/availability?${queryParams.toString()}`
      console.log('[useAvailability] Fetching URL:', url)

      const response = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('[useAvailability] Response status:', response.status)

      if (!response.ok) {
        throw new Error('Falha ao carregar horários disponíveis')
      }

      const data = await response.json()
      console.log('[useAvailability] Response body:', data)
      
      const rawSlots: AvailableSlot[] = data.slots || []

      // Process slots with frontend validation rule: slotLocal > nowLocal
      const processedSlots = rawSlots.map(slot => {
        // Backend provides collision info. Frontend handles "past/future" check.
        const isBooked = !slot.available
        const isFuture = isSlotAvailableOverride(slot.datetime)
        
        return {
          ...slot,
          available: !isBooked && isFuture
        }
      })

      setSlots(processedSlots)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar a agenda.')
      toast.error('Erro ao carregar disponibilidade')
    } finally {
      setLoading(false)
    }
  }, [nutritionistId, startDate, endDate, isSlotAvailableOverride])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  return { slots, loading, error, refetch: fetchAvailability }
}
