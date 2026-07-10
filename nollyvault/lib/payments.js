// ─── Payment helpers ──────────────────────────────────────────────────────────
// Paystack only. Stripe was evaluated and removed — Nigerian-registered
// businesses can't open a standard Stripe merchant account (Nigeria is only in
// Stripe's "extended network" via the Paystack acquisition, which is not the
// same as real Stripe access). Paystack already accepts international cards,
// so diaspora subscribers are covered without a second integration.
// If payment-provider redundancy is ever needed later, Flutterwave was the
// researched fallback — it supports direct Nigerian business registration
// while still processing international cards, closer to a drop-in than
// forming a US entity via Stripe Atlas.

export const PLANS = {
  classic: {
    name: 'Classic',
    priceNGN: 250000,  // ₦2,500/month — launch price (regular ₦3,000)
    nairaDisplay: '₦2,500',
    paystackPlanCode: 'PLN_j2lulnum7u7m6lf',
    devices: 1,
    downloads: false,
    watchParty: false,
  },
  premium: {
    name: 'Premium',
    priceNGN: 350000,  // ₦3,500/month — launch price (regular ₦4,500)
    nairaDisplay: '₦3,500',
    paystackPlanCode: 'PLN_bhay2h9stwucapo',
    devices: 3,
    downloads: true,
    watchParty: false,
  },
  family: {
    name: 'Family & Friends',
    priceNGN: 500000,
    nairaDisplay: '₦5,000',
    paystackPlanCode: 'PLN_5r0a2kgbskwkxgo',
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
