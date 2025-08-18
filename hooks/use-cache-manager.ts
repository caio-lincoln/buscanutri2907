'use client'

import { useEffect, useCallback, useState } from 'react'
import { invalidateBrowserCache } from '@/lib/cache-utils'

interface CacheManagerState {
  isOnline: boolean
  buildId: string | null
  lastUpdate: Date | null
  cacheSize: number
}

export function useCacheManager() {
  const [state, setState] = useState<CacheManagerState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    buildId: null,
    lastUpdate: null,
    cacheSize: 0,
  })

  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Service Worker registered:', registration)

        // Listener para atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true)
                console.log('🔄 New version available')
              }
            })
          }
        })

        return registration
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
        return null
      }
    }
    return null
  }, [])

  // Aplicar atualização
  const applyUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        // window.location.reload()
      }
    }
  }, [])

  // Limpar cache manualmente
  const clearCache = useCallback(async () => {
    try {
      // Limpar cache do browser
      invalidateBrowserCache()

      // Limpar cache do Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.active) {
          const messageChannel = new MessageChannel()

          return new Promise<void>(resolve => {
            messageChannel.port1.onmessage = event => {
              if (event.data.success) {
                console.log('🧹 Service Worker cache cleared')
                resolve()
              }
            }

            registration.active?.postMessage({ type: 'CLEAR_CACHE' }, [
              messageChannel.port2,
            ])
          })
        }
      }

      // Atualizar estado
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        cacheSize: 0,
      }))

      console.log('🧹 All caches cleared successfully')
    } catch (error) {
      console.error('❌ Failed to clear cache:', error)
    }
  }, [])

  // Verificar atualizações
  const checkForUpdates = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()

          const messageChannel = new MessageChannel()

          return new Promise<void>(resolve => {
            messageChannel.port1.onmessage = event => {
              if (event.data.success) {
                console.log('🔍 Update check completed')
                resolve()
              }
            }

            registration.active?.postMessage({ type: 'CHECK_UPDATE' }, [
              messageChannel.port2,
            ])
          })
        }
      }
    } catch (error) {
      console.error('❌ Failed to check for updates:', error)
    }
  }, [])

  // Obter tamanho do cache
  const getCacheSize = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        let totalSize = 0

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()

          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.blob()
              totalSize += blob.size
            }
          }
        }

        setState(prev => ({
          ...prev,
          cacheSize: totalSize,
        }))

        return totalSize
      }
      return 0
    } catch (error) {
      console.error('❌ Failed to get cache size:', error)
      return 0
    }
  }, [])

  // Formatar tamanho do cache
  const formatCacheSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Listener para mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      checkForUpdates()
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkForUpdates])

  // Listener para mensagens do Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { type, buildId, previousBuildId } = event.data

        switch (type) {
          case 'BUILD_UPDATED':
            console.log('🔄 Build updated:', { buildId, previousBuildId })
            setState(prev => ({
              ...prev,
              buildId,
              lastUpdate: new Date(),
            }))
            setUpdateAvailable(true)
            break
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  // Inicialização
  useEffect(() => {
    registerServiceWorker()
    getCacheSize()

    // Verificar atualizações a cada 5 minutos
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [registerServiceWorker, getCacheSize, checkForUpdates])

  return {
    ...state,
    updateAvailable,
    registerServiceWorker,
    applyUpdate,
    clearCache,
    checkForUpdates,
    getCacheSize,
    formatCacheSize: formatCacheSize(state.cacheSize),
    actions: {
      clearCache,
      applyUpdate,
      checkForUpdates,
      getCacheSize,
    },
  }
}
