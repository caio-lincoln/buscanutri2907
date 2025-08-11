import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Verificação segura para SSR
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Definir valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Adicionar listener
    mql.addEventListener('change', onChange)
    
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
