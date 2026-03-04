import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';

// Tenta carregar .env.local primeiro, depois .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_URL = 'http://localhost:3000/api/stripe/webhook';

if (!WEBHOOK_SECRET) {
  console.error('âŒ Erro: STRIPE_WEBHOOK_SECRET nÃ£o estÃ¡ definido nas variÃ¡veis de ambiente.');
  console.error('Certifique-se de que o arquivo .env existe e contÃ©m esta variÃ¡vel.');
  process.exit(1);
}

async function sendWebhookEvent(eventType: string, payloadData: any) {
  console.log(`\n---------------------------------------------------------`);
  console.log(`ðŸ“¡ Enviando evento de teste: ${eventType}`);

  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    object: 'event',
    api_version: '2025-07-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: payloadData,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    },
    type: eventType,
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET as string)
    .update(signedPayload)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: payload,
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`âœ… Sucesso! Status: ${response.status}`);
      console.log(`   Resposta: ${responseText}`);
    } else {
      console.error(`âŒ Falha! Status: ${response.status}`);
      console.error(`   Erro: ${responseText}`);
    }
  } catch (error: any) {
    console.error(`âŒ Erro ao conectar com ${WEBHOOK_URL}:`);
    if (error.code === 'ECONNREFUSED') {
      console.error('   O servidor local parece estar desligado. Certifique-se de rodar "npm run dev" em outro terminal.');
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

// ==========================================
// MOCK DATA DEFINITIONS
// ==========================================

const mockAccountUpdated = {
  id: 'acct_test_12345',
  object: 'account',
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  metadata: {
    user_id: crypto.randomUUID(),
    nutritionist_profile_id: crypto.randomUUID()
  }
};

const mockSubscriptionUpdated = {
  id: 'sub_test_mock_123',
  object: 'subscription',
  customer: 'cus_test_mock_123',
  status: 'active',
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  cancel_at_period_end: false,
  items: {
    data: [{
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    }]
  },
  metadata: {
    user_id: crypto.randomUUID()
  }
};

const mockCheckoutSessionSubscription = {
  id: 'cs_test_mock_sub_123',
  object: 'checkout.session',
  mode: 'subscription',
  subscription: 'sub_test_mock_real_call_will_fail', 
  customer: 'cus_test_mock_123',
  metadata: {
    user_id: crypto.randomUUID()
  },
  payment_status: 'paid'
};

const mockCheckoutSessionTeleconsulta = {
  id: 'cs_test_mock_tele_123',
  object: 'checkout.session',
  mode: 'payment',
  payment_intent: 'pi_test_mock_123',
  metadata: {
    nutritionist_id: crypto.randomUUID(),
    patient_id: crypto.randomUUID(),
    scheduled_at: new Date().toISOString(),
    price: '150.00',
    duration_minutes: '60'
  },
  payment_status: 'paid'
};

const mockPaymentIntent = {
  id: 'pi_test_mock_123',
  object: 'payment_intent',
  amount: 15000,
  currency: 'brl',
  status: 'succeeded'
};

const mockInvoicePaymentFailed = {
  id: 'in_test_mock_123',
  object: 'invoice',
  amount_due: 15000,
  attempt_count: 1,
  status: 'open'
};

// ==========================================
// EXECUTION
// ==========================================

(async () => {
  console.log('Iniciando bateria de testes de webhooks...');
  const includeRealStripeLookupMock = process.env.INCLUDE_STRIPE_SUB_LOOKUP_MOCK === 'true';

  // 1. Account Updated (Stripe Connect)
  await sendWebhookEvent('account.updated', mockAccountUpdated);

  // 2. Subscription Updated
  await sendWebhookEvent('customer.subscription.updated', mockSubscriptionUpdated);

  // 3. Subscription Created (Logica similar ao updated)
  await sendWebhookEvent('customer.subscription.created', mockSubscriptionUpdated);

  // 4. Checkout Session Completed (Subscription)
  // Disabled by default to avoid noisy Stripe 404 logs with fake subscription IDs.
  // Enable only when needed: INCLUDE_STRIPE_SUB_LOOKUP_MOCK=true
  if (includeRealStripeLookupMock) {
    await sendWebhookEvent('checkout.session.completed', mockCheckoutSessionSubscription);
  } else {
    console.log('Skipping checkout.session.completed (subscription mock) by default.');
  }

  // 5. Checkout Session Completed (Teleconsulta)
  // Nota: Isso vai gerar erro de Foreign Key no banco (IDs fake), mas deve retornar 200 OK.
  await sendWebhookEvent('checkout.session.completed', mockCheckoutSessionTeleconsulta);

  // 6. Payment Intent Succeeded
  await sendWebhookEvent('payment_intent.succeeded', mockPaymentIntent);

  // 7. Invoice Payment Failed
  await sendWebhookEvent('invoice.payment_failed', mockInvoicePaymentFailed);

  console.log('\nâœ… Bateria de testes finalizada.');
})();

