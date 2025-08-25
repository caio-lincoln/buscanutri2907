// useMediaQuery.ts
'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    onChange() // primeira medição
    mql.addEventListener?.('change', onChange)
    // fallback para browsers antigos
    mql.addListener?.(onChange)

    return () => {
      mql.removeEventListener?.('change', onChange)
      mql.removeListener?.(onChange)
    }
  }, [query])

  return matches
}
