// lib/subscription-server.ts
import { createClient } from './supabase/server';

type InitialSubscription = {
  userId: string | null;
  hasActiveSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
};

export async function getInitialSubscription(): Promise<InitialSubscription> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { userId: null, hasActiveSubscription: false, status: null, currentPeriodEnd: null };
  }

  const { data: ok } = await supabase.rpc('has_active_subscription', {
    p_user_id: user.id,
    // ajuste se quiser
    p_allow_past_due: true,
    p_grace_minutes: 0,
  });

  // detalhes para UI
  const { data: row } = await supabase
    .from('user_subscriptions')
    .select('status,current_period_end')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    userId: user.id,
    hasActiveSubscription: !!ok,
    status: row?.status ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
  };
}
