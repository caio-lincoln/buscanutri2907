'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

export default function PagamentoSucesso() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Verifica se veio do Stripe
  const fromStripe = searchParams.get('from') === 'stripe'
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Countdown para redirecionamento automático
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Google tag (gtag.js) event – dispara na página de Obrigado
  useEffect(() => {
    try {
      // Comentário equivalente ao pedido: <!-- Google tag (gtag.js) event -->
      const gtag = (window as any)?.gtag
      if (typeof gtag === 'function') {
        gtag('event', 'ads_conversion_Contact_Us_1', {
          // <event_parameters>
        })
      }
    } catch {
      // Silent: evita quebrar a página caso gtag não esteja disponível
    }
  }, [])

  const handleRedirect = () => {
    setIsRedirecting(true)
    router.replace('/dashboard/nutricionistas?activeTab=assinatura')
  }

  const handleImmediateRedirect = () => {
    setIsRedirecting(true)
    router.replace('/dashboard/nutricionistas?activeTab=assinatura')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          {/* Ícone de sucesso com animação */}
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
            </div>
            {/* Círculos de animação */}
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <div className="w-full h-full border-4 border-green-200 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="absolute inset-2 w-16 h-16 mx-auto">
              <div className="w-full h-full border-2 border-green-300 rounded-full animate-ping opacity-30 animation-delay-150"></div>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado! 🎉
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-gray-600 text-lg">
              Obrigado por assinar nossa plataforma!
            </p>
            <p className="text-sm text-gray-500">
              Sua assinatura foi ativada com sucesso e você já pode aproveitar todos os recursos premium.
            </p>
          </div>

          {/* Informações da sessão se disponível */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                ID da sessão: {sessionId.slice(0, 20)}...
              </p>
            </div>
          )}

          {/* Contador de redirecionamento */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">
              Redirecionando automaticamente em:
            </p>
            <div className="text-2xl font-bold text-blue-600">
              {countdown}s
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <Button 
              onClick={handleImmediateRedirect}
              disabled={isRedirecting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  Ir para Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/nutricionistas?activeTab=assinatura')}
              disabled={isRedirecting}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Ver Detalhes da Assinatura
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Você receberá um email de confirmação em breve com todos os detalhes da sua assinatura.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estilos para animação com delay */}
      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
