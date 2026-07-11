import crypto from 'crypto'
import { supabaseAdmin } from '../../../../lib/supabase'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => (body += chunk.toString()))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(rawBody)
    .digest('hex')

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(rawBody)
  const sb = supabaseAdmin()

  switch (event.event) {
    case 'subscription.create':
    case 'charge.success': {
      // Match by paystack_customer_code first (fast path once it's saved),
      // but fall back to email — the webhook can arrive before callback.js
      // has had a chance to save paystack_customer_code to this user's row,
      // since Paystack's webhook delivery often beats the browser's redirect
      // back from checkout. Without this fallback, a real paying customer's
      // very first payment could silently fail to activate their plan.
      const customerCode = event.data?.customer?.customer_code
      const email = event.data?.customer?.email
      let updated = false
      if (customerCode) {
        const { data } = await sb.from('users')
          .update({ plan_status: 'active' })
          .eq('paystack_customer_code', customerCode)
          .select('id')
        updated = data?.length > 0
      }
      if (!updated && email) {
        await sb.from('users')
          .update({ plan_status: 'active', paystack_customer_code: customerCode || null })
          .eq('email', email)
      }
      break
    }
    case 'subscription.not_renew':
    case 'subscription.disable':
      await sb.from('users').update({ plan_status: 'cancelled' })
        .eq('paystack_subscription_code', event.data?.subscription_code)
      break
    case 'invoice.payment_failed':
      await sb.from('users').update({ plan_status: 'past_due' })
        .eq('paystack_customer_code', event.data?.customer?.customer_code)
      break
    default:
      break
  }

  res.status(200).json({ received: true })
}
