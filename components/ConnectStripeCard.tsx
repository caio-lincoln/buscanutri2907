// components/ConnectStripeCard.tsx
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Status = {
  connected: boolean
  onboarded: boolean
  charges_enabled?: boolean
  payouts_enabled?: boolean
  details_submitted?: boolean
  needsOnboarding?: boolean
  accountId?: string
  db_flag?: boolean
}

export function ConnectStripeCard({
  nutritionistUserId,
}: {
  nutritionistUserId: string
}) {
  const [ loading, setLoading ] = useState(false)
  const [ status, setStatus ] = useState<Status | null>(null)

  const loadStatus = async () => {
    if (!nutritionistUserId) return
    try {
      setLoading(true)
      const res = await fetch(
        `/api/stripe/account-status?nutritionistUserId=${encodeURIComponent(
          nutritionistUserId
        )}`
      )
      const json = await res.json()
      setStatus(json)
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const getLoginLink = async () => {
    if (!nutritionistUserId) return
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutritionistUserId }),
      })
      const json = await res.json()
      if (json?.url) window.open(json.url, '_blank')
    } catch (e) {
      console.log("🚀 ~ getLoginLink ~ e:", e)
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()

    const url = new URL(window.location.href)
    if (url.searchParams.get('refresh') === '1') loadStatus()
  }, [ nutritionistUserId ])

  const startOnboarding = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutritionistUserId }),
      })
      const json = await res.json()
      if (json?.url) window.open(json.url, '_blank')
    } finally {
      setLoading(false)
    }
  }

  const connected = !!status?.connected
  const onboarded = !!status?.onboarded
  const charges = status?.charges_enabled ? 'ativadas' : 'desativadas'
  const payouts = status?.payouts_enabled ? 'ativados' : 'desativados'

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pagamentos com Stripe</h3>
        <div className='space-x-2'>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
            Atualizar
          </Button>
          {connected && <>
            <Button size="sm" onClick={getLoginLink} disabled={loading}>
              Ver painel
            </Button>
          </>}
        </div>
      </div>

      <div className="mt-2 text-sm">
        {connected ? (
          <>
            <p className="text-green-700 mb-2">
              Conta conectada ({status?.accountId}).{' '}
              {onboarded ? 'Onboarding completo.' : 'Onboarding pendente.'}
            </p>
            <p className="text-gray-600">
              Cobranças: <b>{charges}</b> · Saques: <b>{payouts}</b>
            </p>
          </>
        ) : (
          <p className="text-amber-700">
            Você ainda não conectou sua conta Stripe.
          </p>
        )}
      </div>

      <Button onClick={startOnboarding} disabled={loading} className="mt-3">
        {connected ? 'Atualizar Informações' : 'Conectar ao Stripe'}
      </Button>
    </div>
  )
}
