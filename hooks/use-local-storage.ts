'use client'

import React, { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para armazenar nosso valor
  // Passar função de estado inicial para useState para que a lógica seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      // Obter do localStorage local por chave
      const item = window.localStorage.getItem(key)
      // Analisar JSON armazenado ou se nenhum retornar initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Se erro também retornar initialValue
      console.log(error)
      return initialValue
    }
  })

  // Retornar uma versão envolvida da função setter useState que ...
  // ... persiste o novo valor no localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Salvar estado
      setStoredValue(valueToStore)
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Uma implementação mais avançada lidaria com o caso de erro
      console.log(error)
    }
  }

  return [storedValue, setValue]
}

export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const useEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
  return useEffect(effect, deps)
}

// Hook para verificar se estamos no cliente
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}