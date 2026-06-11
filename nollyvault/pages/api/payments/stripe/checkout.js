// pages/api/payments/stripe/checkout.js
import { createServerSupabaseClient } from '../../../../lib/supabase'
import { createStripeCheckout } from '../../../../lib/payments'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { planKey } = req.body
  if (!planKey) return res.status(400).json({ error: 'Missing planKey' })

  try {
    // Get Stripe customer ID if they have one
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    const stripeSession = await createStripeCheckout({
      email: session.user.email,
      planKey,
      customerId: user?.stripe_customer_id || null,
    })

    return res.json({ url: stripeSession.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: err.message })
  }
}
