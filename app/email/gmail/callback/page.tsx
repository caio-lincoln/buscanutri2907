'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function GmailCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [ status, setStatus ] = useState<'loading' | 'success' | 'error'>('loading')
  const [ message, setMessage ] = useState('Processando autenticação do Gmail...')
  useEffect(() => {
    (async () => {
      const code = searchParams?.get('code')
      const response = await fetch('/api/admin/gmail/callback?code=' + code)
      const json = await response.json()
      if (json.connected) {
        setStatus('success')
        setMessage('Conta conectada com sucesso')
        router.push('/dashboard/admin?success=gmail_connected')
      } else {
        setStatus('error')
        setMessage('Erro ao conectar a conta')
        router.push('/dashboard/admin?error=' + json.error)
      }

    })()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              {status === 'loading' && (
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              )}
            </div>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Autenticação do Gmail
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>

            {status === 'success' && (
              <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Conta conectada com sucesso</span>
              </div>
            )}

            {status === 'loading' && (
              <div className="mt-6">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-gray-600 text-sm">
        Você será redirecionado automaticamente para o painel de administração.
      </p>
    </div>
  )
}
