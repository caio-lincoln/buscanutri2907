'use client'

import { createSupabaseClient } from '@/lib/supabase'

interface SessionData {
  id?: string
  user_id: string
  session_start: string
  session_end?: string
  duration_seconds?: number
  page_views: number
  user_agent: string
  ip_address?: string
}

class SessionTracker {
  private supabase = createSupabaseClient()
  private sessionId: string | null = null
  private sessionStart: Date | null = null
  private pageViews = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastActivity: Date = new Date()
  private isActive = true
  private isEnding = false

  private isAbortLikeError(err: any): boolean {
    const msg = String((err && (err.message || err.toString())) || '')
    return (
      (err && (err.name === 'AbortError' || err.code === 'ERR_ABORTED')) ||
      msg.toLowerCase().includes('abort') ||
      msg.toLowerCase().includes('networkerror when attempting to fetch resource')
    )
  }

  // Iniciar rastreamento de sessão
  async startSession(userId: string): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Verificar se o usuário está autenticado antes de tentar acessar a tabela
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user || user.id !== userId) {
        console.log('Usuário não autenticado, pulando rastreamento de sessão')
        return
      }

      this.sessionStart = new Date()
      this.pageViews = 1
      this.lastActivity = new Date()

      const sessionData: Omit<SessionData, 'id'> = {
        user_id: userId,
        session_start: this.sessionStart.toISOString(),
        page_views: this.pageViews,
        user_agent: navigator.userAgent,
      }

      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert(sessionData)
        .select('id')
        .single()

      if (error) {
        if (this.isAbortLikeError(error)) {
          console.debug('Sessão: insert abortado/ignorado')
        } else {
          console.error('Erro ao iniciar sessão:', error)
        }
        return
      }

      this.sessionId = data.id
      this.startHeartbeat()
      this.setupActivityListeners()

    } catch (error) {
      if (this.isAbortLikeError(error)) {
        console.debug('Sessão: início abortado/ignorado')
      } else {
        console.error('Erro ao iniciar rastreamento de sessão:', error)
      }
    }
  }

  // Finalizar sessão
  async endSession(): Promise<void> {
    if (!this.sessionId || !this.sessionStart) return
    if (this.isEnding) return
    this.isEnding = true

    try {
      // Verificar se o usuário ainda está autenticado
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('Usuário não autenticado, pulando finalização de sessão')
        this.cleanup()
        return
      }

      const sessionEnd = new Date()
      const startTime = this.sessionStart ? this.sessionStart.getTime() : Date.now()
      const durationSeconds = Math.floor((sessionEnd.getTime() - startTime) / 1000)

      await this.supabase
        .from('user_sessions')
        .update({
          session_end: sessionEnd.toISOString(),
          duration_seconds: durationSeconds,
          page_views: this.pageViews
        })
        .eq('id', this.sessionId)

      this.cleanup()

    } catch (error) {
      if (this.isAbortLikeError(error)) {
        console.debug('Sessão: finalização abortada/ignorada')
      } else {
        console.error('Erro ao finalizar sessão:', error)
      }
    } finally {
      this.isEnding = false
    }
  }

  // Registrar visualização de página
  incrementPageView(): void {
    if (!this.sessionId) return

    this.pageViews++
    this.lastActivity = new Date()

    // Atualizar no banco de dados de forma assíncrona
    this.updatePageViews()
  }

  // Atualizar contagem de páginas no banco
  private async updatePageViews(): Promise<void> {
    if (!this.sessionId) return

    try {
      // Verificar se o usuário ainda está autenticado
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('Usuário não autenticado, pulando atualização de page views')
        return
      }

      await this.supabase
        .from('user_sessions')
        .update({ page_views: this.pageViews })
        .eq('id', this.sessionId)
    } catch (error) {
      if (this.isAbortLikeError(error)) {
        console.debug('Sessão: atualização de page views abortada/ignorada')
      } else {
        console.error('Erro ao atualizar visualizações de página:', error)
      }
    }
  }

  // Configurar heartbeat para manter sessão ativa
  private startHeartbeat(): void {
    // Atualizar a cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      this.checkActivity()
    }, 30000)
  }

  // Verificar se o usuário ainda está ativo
  private checkActivity(): void {
    const now = new Date()
    const last = this.lastActivity ? this.lastActivity.getTime() : 0
    const timeSinceLastActivity = now.getTime() - last
    
    // Se não há atividade por mais de 5 minutos, considerar sessão inativa
    if (timeSinceLastActivity > 5 * 60 * 1000) {
      this.endSession()
    }
  }

  // Configurar listeners para atividade do usuário
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return

    const updateActivity = () => {
      this.lastActivity = new Date()
      this.isActive = true
    }

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Detectar quando a página perde/ganha foco
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false
      } else {
        updateActivity()
      }
    })

    // Finalizar sessão quando a página é fechada
    window.addEventListener('pagehide', () => {
      // Use beacon to avoid aborted network requests when page is unloading
      this.sendSessionEndBeacon()
      void this.endSession()
    })

    // Detectar mudanças de rota (para SPAs)
    // Listener de rota removido; usamos SessionTrackerProvider para isso
  }

  // Limpar recursos
  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    this.sessionId = null
    this.sessionStart = null
    this.pageViews = 0
    this.isActive = false
    this.isEnding = false
  }

  // Obter estatísticas da sessão atual
  getCurrentSessionStats(): { duration: number; pageViews: number } | null {
    if (!this.sessionStart) return null

    const now = new Date()
    const duration = Math.floor((now.getTime() - this.sessionStart.getTime()) / 1000)

    return {
      duration,
      pageViews: this.pageViews
    }
  }

  // Notificar servidor de fim de sessão via beacon
  private sendSessionEndBeacon(): void {
    if (!this.sessionId || !this.sessionStart || typeof navigator === 'undefined' || !('sendBeacon' in navigator)) return
    try {
      const end = new Date()
      const durationSeconds = Math.floor((end.getTime() - this.sessionStart.getTime()) / 1000)
      const payload = {
        session_id: this.sessionId,
        page_views: this.pageViews,
        session_start: this.sessionStart.toISOString(),
        session_end: end.toISOString(),
        duration_seconds: durationSeconds,
      }
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      navigator.sendBeacon('/api/session/end', blob)
    } catch {}
  }
}

// Instância singleton
export const sessionTracker = new SessionTracker()

// Hook para usar o session tracker em componentes React
export function useSessionTracker() {
  return {
    startSession: sessionTracker.startSession.bind(sessionTracker),
    endSession: sessionTracker.endSession.bind(sessionTracker),
    incrementPageView: sessionTracker.incrementPageView.bind(sessionTracker),
    getCurrentStats: sessionTracker.getCurrentSessionStats.bind(sessionTracker)
  }
}