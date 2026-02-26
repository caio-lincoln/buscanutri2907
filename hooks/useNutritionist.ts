
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Nutritionist } from './useNutritionists'

export function useNutritionist(id: string) {
  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchNutritionist()
  }, [id])

  const fetchNutritionist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/nutritionists/${id}`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do nutricionista')
      }
      
      const data = await response.json()
      // Assumindo { nutritionist: { ... } } ou { ... }
      const nutri = data.nutritionist || data
      
      setNutritionist(nutri)
    } catch (err) {
      console.error(err)
      setError('Nutricionista não encontrado ou indisponível.')
      toast.error('Erro ao carregar nutricionista')
    } finally {
      setLoading(false)
    }
  }

  return { nutritionist, loading, error, refetch: fetchNutritionist }
}
