import { Suspense } from 'react'
import GmailCallbackPage from './_client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span>Carregando…</span>
        </div>
      }
    >
      <GmailCallbackPage />
    </Suspense>
  )
}
