'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { visitTracker } from '@/lib/visit-tracker'

export function VisitTrackerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    visitTracker.recordVisit()
  }, [pathname])

  return <>{children}</>
}