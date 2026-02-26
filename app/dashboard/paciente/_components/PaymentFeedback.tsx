'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function PaymentFeedback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  
  const sessionId = searchParams?.get('session_id')
  const status = searchParams?.get('status')
  
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!status) return

    if (status === 'cancelled') {
      toast.error('Falha no pagamento. A consulta não foi agendada.', {
        duration: 5000,
      })
      // Limpar URL
      router.replace('/dashboard/paciente?activeTab=teleconsultas')
      return
    }

    if (status === 'success' && sessionId) {
      setIsPolling(true)
      // Iniciar polling
      const pollAppointment = async () => {
        let attempts = 0
        const maxAttempts = 20 // 20 * 2s = 40s timeout
        
        const interval = setInterval(async () => {
          attempts++
          
          try {
            const { data, error } = await supabase
              .from('payments')
              .select('id, teleconsulta_session_id')
              .eq('stripe_session_id', sessionId)
              .single()
            
            if (data && !error && data.teleconsulta_session_id) {
              clearInterval(interval)
              setIsPolling(false)
              toast.success('Pagamento confirmado! Sua consulta foi agendada.', {
                duration: 5000,
              })
              router.replace('/dashboard/paciente?activeTab=teleconsultas')
            } else if (attempts >= maxAttempts) {
              clearInterval(interval)
              setIsPolling(false)
              toast.error('O pagamento foi processado, mas houve uma demora na confirmação. Por favor, verifique suas consultas em instantes.', {
                duration: 8000,
              })
              router.replace('/dashboard/paciente?activeTab=teleconsultas')
            }
          } catch (err) {
            console.error('Erro ao verificar agendamento:', err)
          }
        }, 2000)

        return () => clearInterval(interval)
      }

      pollAppointment()
    }
  }, [status, sessionId, router, supabase])

  if (!isPolling) return null

  return (
    <AlertDialog open={isPolling}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Confirmando pagamento...
          </AlertDialogTitle>
          <AlertDialogDescription>
            Aguarde enquanto processamos seu agendamento. Isso pode levar alguns segundos.
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}
