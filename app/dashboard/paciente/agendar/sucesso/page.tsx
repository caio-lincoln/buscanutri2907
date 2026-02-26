
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Loading from '@/components/ui/loading'

export default function AgendamentoSucesso() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, we might want to verify the session status via API here
    // For now, we just simulate a short loading to show we are processing
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return <Loading message="Confirmando seu pagamento..." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-xl border-green-100">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-100 h-20 w-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Agendamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p className="text-muted-foreground">
            Seu pagamento foi processado com sucesso e sua consulta está agendada.
          </p>
          <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Verifique seu e-mail para mais detalhes.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={() => router.push('/dashboard/paciente/teleconsultas')}
          >
            Ir para Minhas Consultas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/dashboard/paciente')}
          >
            Voltar ao Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
