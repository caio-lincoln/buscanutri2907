'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Initial } from '../hooks/use-has-active-subscription';
import { createSupabaseClient } from '../lib/supabase';

type Ctx = {
  hasActiveSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const SubscriptionCtx = createContext<Ctx | null>(null);

export function SubscriptionProvider({ initial, children }: { initial: Initial; children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [ hasActive, setHasActive ] = useState(initial.hasActiveSubscription);
  const [ status, setStatus ] = useState<string | null>(initial.status);
  const [ currentEnd, setCurrentEnd ] = useState<string | null>(initial.currentPeriodEnd);
  const [ loading, setLoading ] = useState(false);
  const userId = initial.userId;

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: ok } = await supabase.rpc('has_active_subscription', {
        p_user_id: userId,
        p_allow_past_due: true,
        p_grace_minutes: 0,
      });
      setHasActive(!!ok);

      const { data: row } = await supabase
        .from('user_subscriptions')
        .select('status,current_period_end')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStatus(row?.status ?? null);
      setCurrentEnd(row?.current_period_end ?? null);
    } finally {
      setLoading(false);
    }
  }, [ supabase, userId ]);

  useEffect(() => {
    if (!userId) return;
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
  }, [ supabase, userId, refetch ]);

  // useEffect(() => {
  //   refetch()
  // }, [userId])

  const value = useMemo<Ctx>(() => ({
    hasActiveSubscription: hasActive,
    status,
    currentPeriodEnd: currentEnd,
    loading,
    refetch,
  }), [ hasActive, status, currentEnd, loading, refetch ]);

  return <SubscriptionCtx.Provider value={value}>{children}</SubscriptionCtx.Provider>;
}

export function useSubscriptionContext() {
  const ctx = useContext(SubscriptionCtx);
  if (!ctx) throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  return ctx;
}
