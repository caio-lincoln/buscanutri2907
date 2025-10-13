'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseClient } from '../lib/supabase';
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type Sub = {
  status: string | null;
  current_period_end: string | null;
};

type Offer = {
  priceId: string;
  productId: string;
  name: string;
  description: string;
  label: string; // ex.: "R$ 39 / month"
};

export default function SubscriptionCard() {
  const supabase = createSupabaseClient();
  const [ loading, setLoading ] = useState(false);
  const [ loadingPrice, setLoadingPrice ] = useState<string | null>(null);
  const [ sub, setSub ] = useState<Sub | null>(null);
  const [ offers, setOffers ] = useState<Offer[] | null>(null);

  const isActive =
    sub?.status === 'active' ||
    sub?.status === 'trialing' ||
    sub?.status === 'past_due'; // se não quiser liberar past_due, remova aqui

  useEffect(() => {
    fetch('/api/stripe/list-offers')
      .then((r) => r.json())
      .then(({ offers }) => {
        // Filtrar para manter apenas o plano de R$ 24,90/mês
        const parseBrlAmount = (label: string): number => {
          try {
            // Extrai o valor numérico de strings no formato "R$ 24,90/mês"
            const match = label.match(/R\$\s*([0-9.,]+)/i);
            if (!match) return NaN;
            const raw = match[1]
              .replace(/\./g, '') // remove separador de milhar
              .replace(/,/g, '.'); // converte decimal
            return parseFloat(raw);
          } catch {
            return NaN;
          }
        };

        const filtered = (offers || []).filter((o: Offer) => {
          const amount = parseBrlAmount(o.label);
          return Math.abs(amount - 24.9) < 0.001; // mantém apenas 24,90
        });
        setOffers(filtered);
      })
      .catch(() => setOffers([]));
  }, []);

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
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub(data ?? { status: null, current_period_end: null });
    })();
  }, []);

  function ptPrice(label: string) {
    // Ex.: "R$ 39 / month" -> "R$ 39 / mês"
    return label.replace(/month/i, 'mês');
  }

  const endDateText = useMemo(() => {
    if (!sub?.current_period_end) return null;
    try {
      return new Date(sub.current_period_end).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [ sub?.current_period_end ]);

  const startCheckout = async (priceId: string) => {
    setLoading(true);
    setLoadingPrice(priceId);
    try {
      const res = await fetch('/api/stripe/create-checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoading(false);
      setLoadingPrice(null);
    }
  };

  const openPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/create-portal-link', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-8xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1D40]">Assinatura</h1>
        <p className="text-sm text-[#1E1D40]/70">
          Gerencie sua assinatura da plataforma Busca Nutri.
        </p>
      </div>

      {/* Status card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d95b4a] via-[#1E90B5] to-[#401d1d]" />

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-[#F2FAFE] border border-[#D7EEF8] p-4">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">
                      Assinatura ativa
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-700">
                      Assinatura necessária
                    </span>
                  </>
                )}
              </div>

              <div className="mt-2 text-sm text-[#1E1D40]/80">
                {sub?.status ? (
                  <p>
                    Status atual:{' '}
                    <span className="font-medium">{sub.status}</span>
                    {endDateText && (
                      <span className="text-[#1E1D40]/60">
                        {' '}
                        (até {endDateText})
                      </span>
                    )}
                  </p>
                ) : (
                  <p>Você ainda não possui uma assinatura.</p>
                )}
              </div>

              {!isActive && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-4 w-4" />
                    <p>
                      <span className="font-medium">Atenção, nutricionista:</span>{' '}
                      recursos do painel como <em>Teleconsultas</em>,{' '}
                      <em>Chat</em>, <em>Vagas</em>, <em>Cursos</em> e{' '}
                      <em>Relatórios</em> ficam disponíveis apenas com uma
                      assinatura ativa.
                    </p>
                  </div>
                </div>
              )}

              {isActive ? (
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    onClick={openPortal}
                    disabled={loading}
                    className="bg-[#1E1D40] hover:bg-[#1B1A39]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Abrindo portal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Gerenciar assinatura
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-emerald-700">
                    <CheckCircle2 className="mr-1 inline h-4 w-4" />
                    Obrigado por apoiar a plataforma!
                  </span>
                </div>
              ) : null}

              {/* Benefícios */}
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2 text-[#1E1D40]">
                  <Sparkles className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">
                    Benefícios da assinatura
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-[#1E1D40]/80">
                  <li>• Recebimento de pacientes por destaque</li>
                  <li>• Agenda de teleconsultas integrada</li>
                  <li>• Chat seguro com seus pacientes</li>
                  <li>• Vagas e oportunidades exclusivas</li>
                  <li>• Relatórios e métricas profissionais</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ofertas */}
          <div className="lg:col-span-2">
            {!isActive && (
              <div className="mb-3 flex items-center gap-2 text-sm text-[#1E1D40]/70">
                <Crown className="h-4 w-4 text-[#4AB0D9]" />
                <span>Escolha um plano para desbloquear todos os recursos.</span>
              </div>
            )}

            {offers === null ? (
              // skeleton
              <div className="grid gap-4 sm:grid-cols-2">
                {[ 0, 1 ].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-100" />
                    <div className="mt-5 h-8 w-32 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-[#1E1D40]/70">
                Nenhuma oferta disponível no momento.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {offers.map((o, idx) => {
                  const recommended = idx === 0; // destaque o primeiro plano
                  return (
                    <div
                      key={o.priceId}
                      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition ${recommended
                          ? 'border-[#4AB0D9]/50 ring-1 ring-[#4AB0D9]/30'
                          : 'border-gray-100'
                        }`}
                    >
                      {recommended && (
                        <div className="pointer-events-none absolute right-0 top-0 rounded-bl-xl bg-[#4AB0D9] px-3 py-1 text-xs font-semibold text-white">
                          Recomendado
                        </div>
                      )}

                      <h3 className="text-base font-semibold text-[#1E1D40]">
                        {o.name}
                      </h3>

                      {o.description && (
                        <p className="mt-1 text-sm text-[#1E1D40]/70">
                          {o.description}
                        </p>
                      )}

                      <p className="mt-4 text-2xl font-bold text-[#1E1D40]">
                        {ptPrice(o.label)}
                      </p>

                      {/* Texto de promoção explícito */}
                      <p className="mt-1 text-sm text-[#1E1D40]/70">
                        De <span className="line-through">R$ 49,90</span> por
                        {' '}<span className="font-semibold text-[#d95b4a]">R$ 24,90</span>
                        {' '}<span className="text-[#1E1D40]/60">(promoção temporária)</span>
                      </p>

                      <Button
                        className={`mt-5 w-full ${recommended
                            ? 'bg-[#4AB0D9] hover:bg-[#3AA4CE]'
                            : 'bg-[#1E1D40] hover:bg-[#1B1A39]'
                          }`}
                        onClick={() => startCheckout(o.priceId)}
                        disabled={loading || isActive}
                      >
                        {loading && loadingPrice === o.priceId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : isActive ? (
                          'Já é assinante'
                        ) : (
                          'Assinar agora'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé sutil */}
            <p className="mt-4 text-xs text-[#1E1D40]/50">
              Ao assinar, você concorda com os Termos de Uso e a Política de
              Privacidade. A assinatura é renovada automaticamente e pode ser
              gerenciada a qualquer momento no portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
