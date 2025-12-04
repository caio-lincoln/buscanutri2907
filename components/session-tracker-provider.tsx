'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sessionTracker } from '@/lib/session-tracker'

export function SessionTrackerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Incrementar page view quando a rota muda
    sessionTracker.incrementPageView()
  }, [pathname])

  return <>{children}</>
}
