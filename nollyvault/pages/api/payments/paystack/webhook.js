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
    case 'charge.success':
      await sb.from('users').update({ plan_status: 'active' })
        .eq('paystack_customer_code', event.data?.customer?.customer_code)
      break
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
