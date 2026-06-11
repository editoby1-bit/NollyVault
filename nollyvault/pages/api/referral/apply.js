// POST /api/referral/apply
// Called after signup to link a user to a referral code
import { createServerSupabaseClient, supabaseAdmin } from '../../../lib/supabase'

const REFERRAL_PCT = 0.05  // 5% off subscription to referring actor

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Missing code' })

  const sb = supabaseAdmin()

  // Validate code
  const { data: referralCode, error } = await sb
    .from('actor_referral_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !referralCode) return res.status(404).json({ error: 'Invalid code' })

  // Check user hasn't already been referred
  const { data: existing } = await sb
    .from('referrals')
    .select('id')
    .eq('referred_user_id', session.user.id)
    .single()

  if (existing) return res.status(409).json({ error: 'Already referred' })

  // Link the referral
  await sb.from('referrals').insert({
    referral_code: code.toUpperCase(),
    veteran_actor_id: referralCode.veteran_actor_id,
    actor_name: referralCode.actor_name,
    referred_user_id: session.user.id,
  })

  // Update user record
  await sb.from('users').update({
    referred_by_code: code.toUpperCase(),
    referred_by_actor_id: referralCode.veteran_actor_id,
  }).eq('id', session.user.id)

  // Increment total referrals counter
  await sb.from('actor_referral_codes')
    .update({ total_referrals: referralCode.total_referrals + 1 })
    .eq('code', code.toUpperCase())

  return res.json({ success: true, actor_name: referralCode.actor_name })
}
