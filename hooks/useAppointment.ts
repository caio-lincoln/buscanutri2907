
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
      // 1. Create Appointment (Pending)
      const appointmentResponse = await fetch('/api/appointments/create', {
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

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao criar agendamento')
      }

      const { appointment_id } = await appointmentResponse.json()

      // 2. Create Stripe Checkout Session
      const checkoutResponse = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id,
        }),
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao criar sessão de pagamento')
      }

      const { checkout_url } = await checkoutResponse.json()

      // 3. Redirect to Stripe
      window.location.href = checkout_url
      
    } catch (err: any) {
      console.error(err)
      const msg = err.message || 'Erro inesperado ao agendar'
      setError(msg)
      toast.error(msg)
      // Don't throw, just handle error state
    } finally {
      setLoading(false)
    }
  }

  return { createAppointment, loading, error }
}
