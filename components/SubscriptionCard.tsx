'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseClient } from '../lib/supabase';

type Sub = {
  status: string | null;
  current_period_end: string | null;
};

type Offer = {
  priceId: string
  productId: string
  name: string
  description: string
  label: string
}

export default function SubscriptionCard() {
  const supabase = createSupabaseClient();
  const [ loading, setLoading ] = useState(false);
  const [ sub, setSub ] = useState<Sub | null>(null);

  const [ offers, setOffers ] = useState<Offer[]>([])

  useEffect(() => {
    fetch('/api/stripe/list-offers')
      .then(r => r.json())
      .then(({ offers }) => setOffers(offers))
      .catch(() => setOffers([]))
  }, [])

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('status,current_period_end')
        .eq('user_id', user.id)
        .single();
      setSub(data ?? { status: null, current_period_end: null });
    })();
  }, []);

  const startCheckout = async (priceId: string) => {
    setLoading(true)
    const res = await fetch('/api/stripe/create-checkout-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.url) window.location.href = json.url
  }

  const openPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/create-portal-link', { method: 'POST' });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoading(false);
    }
  };

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Assinatura</h1>

      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Status atual:</p>
          <p className="font-medium">
            {sub?.status ?? 'Sem assinatura'}
            {sub?.current_period_end && (
              <span className="text-sm text-muted-foreground">
                {' '}
                (até {new Date(sub.current_period_end).toLocaleDateString()})
              </span>
            )}
          </p>
        </div>

        {!isActive ? (
          <div className="grid gap-4">
            {offers.map(o => (
              <div key={o.priceId} className="rounded-md border p-4">
                <h3 className="font-semibold">{o.name}</h3>
                {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
                <p className="mt-2 text-xl font-bold">{o.label.replace('month', 'mês')}</p>
                <Button className="mt-4" onClick={() => startCheckout(o.priceId)} disabled={loading}>
                  {loading ? 'Carregando...' : 'Assinar agora'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="default" onClick={openPortal} disabled={loading}>
              {loading ? 'Abrindo...' : 'Gerenciar assinatura'}
            </Button>
            <span className="text-sm text-green-700">Você já é assinante 🎉</span>
          </div>
        )}
      </div>
    </div>
  );
}
