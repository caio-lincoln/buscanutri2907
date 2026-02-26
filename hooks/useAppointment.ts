
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CreateAppointmentData {
  nutritionist_id: string
  scheduled_at: string // ISO
  price: number
}

export function useAppointment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const createAppointment = async (data: CreateAppointmentData) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Create Stripe Checkout Session (Directly - No pre-booking)
      const checkoutResponse = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: data.nutritionist_id,
          scheduled_at: data.scheduled_at,
          price: data.price,
        }),
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao iniciar pagamento')
      }

      const { checkout_url } = await checkoutResponse.json()

      // 2. Redirect to Stripe
      window.location.href = checkout_url
      
    } catch (err: any) {
      console.error(err)
      const msg = err.message || 'Erro inesperado ao agendar'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { createAppointment, loading, error }
}
