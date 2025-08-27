'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseClient } from '../lib/supabase';

export type Initial = {
  userId: string | null;
  hasActiveSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
};

type Options = {
  initial?: Initial;       
  realtime?: boolean;      
  allowPastDue?: boolean; 
  graceMinutes?: number;  
};

export function useHasActiveSubscription(opts: Options = {}) {
  const {
    initial,
    realtime = true,
    allowPastDue = true,
    graceMinutes = 0,
  } = opts;

  const supabase = useMemo(() => createSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(initial?.userId ?? null);

  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(initial?.hasActiveSubscription ?? false);
  const [status, setStatus] = useState<string | null>(initial?.status ?? null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(initial?.currentPeriodEnd ?? null);
  const [loading, setLoading] = useState<boolean>(false); // não precisamos "true" se há initial
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted.current) return;
        setUserId(user?.id ?? null);
      })();
    }
    return () => { mounted.current = false; };
  }, [ userId, supabase ]);
  
  useEffect(() => {
    refetch()
  }, [userId])

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ok } = await supabase.rpc('has_active_subscription', {
        p_user_id: userId,
        p_allow_past_due: allowPastDue,
        p_grace_minutes: graceMinutes,
      });
      setHasActiveSubscription(!!ok);

      const { data: row } = await supabase
      .from('user_subscriptions')
      .select('status,current_period_end')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
      setStatus(row?.status ?? null);
      setCurrentPeriodEnd(row?.current_period_end ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao consultar assinatura');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, allowPastDue, graceMinutes]);

  // Realtime para atualizar silenciosamente
  useEffect(() => {
    if (!realtime || !userId) return;
    const ch = supabase
      .channel('user_subscriptions_watch')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${userId}`,
      }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [realtime, userId, supabase, refetch]);

  return { hasActiveSubscription, status, currentPeriodEnd, loading, error, refetch };
}
