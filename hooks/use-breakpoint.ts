'use client'

import { useEffect, useState } from 'react'

export function useBreakpoint() {
  const get = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 0
    const isMobile = width <= 640
    const isTablet = width > 640 && width <= 1024
    const isDesktop = width > 1024
    return { width, isMobile, isTablet, isDesktop }
  }

  const [state, setState] = useState(get)

  useEffect(() => {
    const onResize = () => setState(get())
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return state
}

