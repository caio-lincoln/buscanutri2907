'use client'

import { useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que só renderiza no cliente para evitar problemas de hidratação no SSR
 * Útil para componentes que dependem de APIs do browser (localStorage, window, etc.)
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook para verificar se o componente está sendo renderizado no cliente
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook para acessar storage de forma segura no SSR
 * DEPRECATED: Use useStorage() do sistema de storage em vez disso
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const loadFromStorage = async () => {
      try {
        // Usar o novo sistema de storage
        const { storage } = await import('@/lib/storage')
        const item = await storage.get<T>(key, initialValue)
        if (item !== null) {
          setStoredValue(item)
        }
      } catch (error) {
        console.warn(`Erro ao ler storage para a chave "${key}":`, error)
        
        // Fallback para sessionStorage se o novo sistema falhar
        try {
          const item = window.sessionStorage.getItem(key)
          if (item) {
            setStoredValue(JSON.parse(item))
          }
        } catch (fallbackError) {
          console.warn(`Fallback também falhou para a chave "${key}":`, fallbackError)
        }
      }
    }

    loadFromStorage()
  }, [key, initialValue])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (isClient) {
        // Usar o novo sistema de storage
        import('@/lib/storage').then(({ storage }) => {
          storage.set(key, valueToStore).catch(error => {
            console.warn(`Erro ao salvar no storage para a chave "${key}":`, error)
            
            // Fallback para sessionStorage
            try {
              window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
            } catch (fallbackError) {
              console.warn(`Fallback de salvamento também falhou para a chave "${key}":`, fallbackError)
            }
          })
        }).catch(error => {
          console.warn(`Erro ao importar storage para a chave "${key}":`, error)
          
          // Fallback direto para sessionStorage
          try {
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
          } catch (fallbackError) {
            console.warn(`Fallback de salvamento também falhou para a chave "${key}":`, fallbackError)
          }
        })
      }
    } catch (error) {
      console.warn(`Erro ao processar valor para a chave "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook para acessar sessionStorage de forma segura no SSR
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const item = window.sessionStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Erro ao ler sessionStorage para a chave "${key}":`, error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (isClient) {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Erro ao salvar no sessionStorage para a chave "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
