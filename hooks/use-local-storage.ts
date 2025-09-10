'use client'

import React, { useState, useEffect } from 'react'
// import { useStorage } from '@/lib/storage'

// export function useLocalStorage<T>(
//   key: string,
//   initialValue: T
// ): [T, (value: T | ((val: T) => T)) => void] {
//   // Estado para armazenar nosso valor - sempre inicia com initialValue para evitar hidratação
//   const [storedValue, setStoredValue] = useState<T>(initialValue)
//   const [isClient, setIsClient] = useState(false)
//   const storage = useStorage()

//   // Efeito para carregar do storage apenas no cliente
//   useEffect(() => {
//     setIsClient(true)
    
//     const loadStoredValue = async () => {
//       try {
//         const item = await storage.get<T>(key, initialValue)
//         if (item !== null) {
//           setStoredValue(item)
//         }
//       } catch (error) {
//         console.warn(`Erro ao ler storage para a chave "${key}":`, error)
//       }
//     }

//     loadStoredValue()
//   }, [key, storage, initialValue])

//   // Retornar uma versão envolvida da função setter useState que ...
//   // ... persiste o novo valor no storage.
//   const setValue = (value: T | ((val: T) => T)) => {
//     try {
//       // Permitir que value seja uma função para que tenhamos a mesma API que useState
//       const valueToStore =
//         value instanceof Function ? value(storedValue) : value
      
//       // Salvar estado
//       setStoredValue(valueToStore)
      
//       // Salvar no storage apenas se estivermos no cliente
//       if (isClient) {
//         storage.set(key, valueToStore).catch(error => {
//           console.warn(`Erro ao salvar no storage para a chave "${key}":`, error)
//         })
//       }
//     } catch (error) {
//       console.warn(`Erro ao processar valor para a chave "${key}":`, error)
//     }
//   }

//   return [storedValue, setValue]
// }

// export function useIsomorphicLayoutEffect(
//   effect: React.EffectCallback,
//   deps?: React.DependencyList
// ) {
//   const useEffect =
//     typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
//   return useEffect(effect, deps)
// }

// Hook para verificar se estamos no cliente
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
