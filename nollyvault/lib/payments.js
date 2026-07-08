// ─── Payment helpers ──────────────────────────────────────────────────────────

export const PLANS = {
  classic: {
    name: 'Classic',
    priceNGN: 150000,  // charged at ₦1,500 (shown as ₦2,500 slashed)      // Paystack uses kobo (1/100 of naira)
    priceUSD: 499,         // Stripe uses cents
    nairaDisplay: '₦1,500',  // discounted from ₦2,500
    usdDisplay: '$4.99',
    paystackPlanCode: 'PLN_classic_monthly', // set after creating in Paystack dashboard
    stripePriceId: 'price_classic_monthly',  // set after creating in Stripe dashboard
    devices: 1,
    downloads: false,
    watchParty: false,
  },
  premium: {
    name: 'Premium',
    priceNGN: 300000,  // charged at ₦3,000 (shown as ₦3,500 slashed)
    priceUSD: 999,
    nairaDisplay: '₦3,000',  // discounted from ₦3,500
    usdDisplay: '$9.99',
    paystackPlanCode: 'PLN_premium_monthly',
    stripePriceId: 'price_premium_monthly',
    devices: 3,
    downloads: true,
    watchParty: false,
  },
  family: {
    name: 'Family & Friends',
    priceNGN: 500000,
    priceUSD: 1499,
    nairaDisplay: '₦5,000',
    usdDisplay: '$14.99',
    paystackPlanCode: 'PLN_family_monthly',
    stripePriceId: 'price_family_monthly',
    devices: 5,
    downloads: true,
    watchParty: true,
  },
}

// ─── PAYSTACK ─────────────────────────────────────────────────────────────────

/**
 * Initialize a Paystack subscription transaction.
 * Returns an authorization_url to redirect the user to.
 */
export async function initializePaystackSubscription({ email, planKey }) {
  const plan = PLANS[planKey]
  if (!plan) throw new Error('Invalid plan')

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: plan.priceNGN,
      plan: plan.paystackPlanCode,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
      metadata: { planKey },
    }),
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Paystack init failed')
  return data.data // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction by reference (called after redirect back).
 */
export async function verifyPaystackTransaction(reference) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()
  return data // { status, data: { status: 'success', customer, ... } }
}

/**
 * Cancel a Paystack subscription
 */
export async function cancelPaystackSubscription(subscriptionCode, emailToken) {
  const res = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  })
  return res.json()
}

// ─── STRIPE ───────────────────────────────────────────────────────────────────
// Install: npm install stripe
// Only import stripe on the server side (API routes)

/**
 * Create a Stripe Checkout session for diaspora subscribers.
 * Call from an API route only.
 */
export async function createStripeCheckout({ email, planKey, customerId }) {
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const plan = PLANS[planKey]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: customerId ? undefined : email,
    customer: customerId || undefined,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { planKey },
  })
  return session // session.url is the checkout page to redirect to
}
