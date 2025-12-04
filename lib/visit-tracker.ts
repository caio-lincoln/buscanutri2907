'use client'

import { createSupabaseClient } from '@/lib/supabase'

export class VisitTracker {
  private supabase = createSupabaseClient()
  private isRecorded = false

  async recordVisit(): Promise<void> {
    if (typeof window === 'undefined' || this.isRecorded) return

    try {
      const path = window.location.pathname + window.location.search
      const referrer = document.referrer || null
      const userAgent = navigator.userAgent

      await this.supabase
        .from('web_visits')
        .insert({
          path,
          referrer,
          user_agent: userAgent,
        })

      this.isRecorded = true
    } catch (error) {
      console.error('Erro ao registrar visita:', error)
    }
  }
}

export const visitTracker = new VisitTracker()
