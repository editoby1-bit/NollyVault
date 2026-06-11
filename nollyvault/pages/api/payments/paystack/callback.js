// pages/api/payments/paystack/callback.js
// Paystack redirects here after payment. We verify and activate the subscription.
import { verifyPaystackTransaction } from '../../../../lib/payments'
import { supabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  const { reference } = req.query
  if (!reference) return res.redirect('/?error=missing_reference')

  try {
    const result = await verifyPaystackTransaction(reference)
    if (result.data?.status !== 'success') {
      return res.redirect('/pricing?error=payment_failed')
    }

    const { customer, metadata, subscription } = result.data
    const planKey = metadata?.planKey

    // Activate the user's plan in Supabase
    const sb = supabaseAdmin()
    await sb
      .from('users')
      .update({
        plan: planKey,
        plan_status: 'active',
        paystack_customer_code: customer.customer_code,
        paystack_subscription_code: subscription?.subscription_code || null,
      })
      .eq('email', customer.email)

    return res.redirect('/account?payment=success')
  } catch (err) {
    console.error('Paystack callback error:', err)
    return res.redirect('/pricing?error=server_error')
  }
}
