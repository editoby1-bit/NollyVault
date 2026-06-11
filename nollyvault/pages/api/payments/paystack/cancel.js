// pages/api/payments/paystack/cancel.js
import { createServerSupabaseClient } from '../../../../lib/supabase'
import { cancelPaystackSubscription } from '../../../../lib/payments'
import { supabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { data: user } = await supabase
    .from('users')
    .select('paystack_subscription_code, email')
    .eq('id', session.user.id)
    .single()

  if (!user?.paystack_subscription_code) {
    return res.status(400).json({ error: 'No Paystack subscription found' })
  }

  try {
    // Paystack requires the subscription email token for cancellation
    // In production: fetch it from Paystack or store it during webhook
    await cancelPaystackSubscription(user.paystack_subscription_code, user.email)

    await supabaseAdmin()
      .from('users')
      .update({ plan_status: 'cancelled' })
      .eq('id', session.user.id)

    return res.json({ cancelled: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
