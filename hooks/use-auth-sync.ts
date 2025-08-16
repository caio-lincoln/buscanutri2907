'use client'
import { useEffect, useCallback, useMemo, useRef } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGED' | 'SIGN_OUT' | 'SIGN_IN'
  userId?: string
  timestamp: number
  origin: string           
}

export function useAuthSync(onAuthChange?: () => void) {
  const tabId = useRef<string>(crypto.randomUUID())

  const broadcastAuthChange = useCallback((type: AuthSyncMessage['type'], userId?: string) => {
    if (typeof window === 'undefined') return
    const ch = new BroadcastChannel('auth-sync')
    ch.postMessage({ type, userId, timestamp: Date.now(), origin: tabId.current } as AuthSyncMessage)
    ch.close()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ch = new BroadcastChannel('auth-sync')
    const onMessage = (ev: MessageEvent<AuthSyncMessage>) => {
      const msg = ev.data
      if (msg.origin === tabId.current) return
      if (Date.now() - msg.timestamp > 5000) return
      onAuthChange?.()
    }
    ch.addEventListener('message', onMessage)
    return () => { ch.removeEventListener('message', onMessage); ch.close() }
  }, [onAuthChange])

  return { broadcastAuthChange }
}

