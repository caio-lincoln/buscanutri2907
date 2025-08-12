'use client'

import { useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGED' | 'SIGN_OUT' | 'SIGN_IN'
  userId?: string
  timestamp: number
}

/**
 * Hook para sincronizar o estado de autenticação entre abas do navegador
 * Usa BroadcastChannel para comunicação entre abas
 */
export function useAuthSync(onAuthChange?: () => void) {
  const supabase = createSupabaseClient()

  const broadcastAuthChange = useCallback((type: AuthSyncMessage['type'], userId?: string) => {
    if (typeof window === 'undefined') return

    try {
      const channel = new BroadcastChannel('auth-sync')
      const message: AuthSyncMessage = {
        type,
        userId,
        timestamp: Date.now()
      }
      channel.postMessage(message)
      channel.close()
    } catch (error) {
      // BroadcastChannel não suportado ou erro
      console.warn('Erro ao sincronizar autenticação entre abas:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let channel: BroadcastChannel

    try {
      channel = new BroadcastChannel('auth-sync')

      const handleMessage = (event: MessageEvent<AuthSyncMessage>) => {
        const { type, timestamp } = event.data

        // Ignorar mensagens muito antigas (mais de 5 segundos)
        if (Date.now() - timestamp > 5000) return

        switch (type) {
          case 'SIGN_OUT':
            // Forçar logout em todas as abas
            supabase.auth.signOut({ scope: 'local' })
            if (onAuthChange) onAuthChange()
            break
          case 'SIGN_IN':
          case 'AUTH_STATE_CHANGED':
            // Recarregar estado de autenticação
            if (onAuthChange) onAuthChange()
            break
        }
      }

      channel.addEventListener('message', handleMessage)

      // Escutar mudanças de autenticação e broadcast para outras abas
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            broadcastAuthChange('SIGN_IN', session?.user?.id)
            break
          case 'SIGNED_OUT':
            broadcastAuthChange('SIGN_OUT')
            break
          case 'TOKEN_REFRESHED':
            broadcastAuthChange('AUTH_STATE_CHANGED', session?.user?.id)
            break
        }
      })

      return () => {
        subscription.unsubscribe()
        channel.removeEventListener('message', handleMessage)
        channel.close()
      }
    } catch (error) {
      // BroadcastChannel não suportado
      console.warn('BroadcastChannel não suportado neste navegador')
      return
    }
  }, [supabase, broadcastAuthChange, onAuthChange])

  return { broadcastAuthChange }
}