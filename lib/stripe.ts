import Stripe from 'stripe'

// Inicialização tolerante: em ambientes sem STRIPE_SECRET_KEY, exporta null
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY

export const stripe: Stripe | null = STRIPE_KEY
  ? new Stripe(STRIPE_KEY, {
      apiVersion: '2025-07-30.basil',
    })
  : null
