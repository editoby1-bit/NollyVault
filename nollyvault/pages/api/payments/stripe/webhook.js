// pages/api/payments/stripe/webhook.js
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

  let event
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature']
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const sb = supabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const planKey = session.metadata?.planKey
      await sb.from('users')
        .update({ plan: planKey, plan_status: 'active', stripe_customer_id: session.customer })
        .eq('email', session.customer_email)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object
      const status = { active:'active', past_due:'past_due', canceled:'cancelled' }[sub.status] || sub.status
      await sb.from('users').update({ plan_status: status }).eq('stripe_customer_id', sub.customer)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await sb.from('users').update({ plan_status: 'cancelled', plan: null }).eq('stripe_customer_id', sub.customer)
      break
    }
    default: break
  }

  res.status(200).json({ received: true })
}
