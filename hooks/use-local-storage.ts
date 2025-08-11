'use client'

import React, { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para armazenar nosso valor - sempre inicia com initialValue para evitar hidratação
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isClient, setIsClient] = useState(false)

  // Efeito para carregar do localStorage apenas no cliente
  useEffect(() => {
    setIsClient(true)
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Erro ao ler localStorage para a chave "${key}":`, error)
    }
  }, [key])

  // Retornar uma versão envolvida da função setter useState que ...
  // ... persiste o novo valor no localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      // Salvar estado
      setStoredValue(valueToStore)
      // Salvar no localStorage apenas se estivermos no cliente
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Erro ao salvar no localStorage para a chave "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

export function useIsomorphicLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const useEffect =
    typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
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
