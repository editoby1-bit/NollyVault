// pages/api/payments/paystack/initialize.js
import { initializePaystackSubscription } from '../../../../lib/payments'
import { supabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, planKey, userId } = req.body
  if (!email || !planKey) return res.status(400).json({ error: 'Missing fields' })

  try {
    const data = await initializePaystackSubscription({ email, planKey })
    res.json({ authorization_url: data.authorization_url, reference: data.reference })
  } catch (err) {
    console.error('Paystack init error:', err)
    res.status(500).json({ error: err.message })
  }
}
