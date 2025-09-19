'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const FB_PIXEL_ID = process.env['NEXT_PUBLIC_FB_PIXEL_ID']

export default function MetaPixelRouteChange() {
  const pathname = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.fbq || !FB_PIXEL_ID) return
    window.fbq('track', 'PageView')
  }, [pathname, search])

  return null
}
