// POST /api/admin/referral/calculate
// Calculate monthly referral earnings for all actors
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
const REFERRAL_PCT = 0.05

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email))
    return res.status(403).json({ error: 'Forbidden' })

  const { period } = req.body
  if (!period) return res.status(400).json({ error: 'Missing period' })

  const sb = supabaseAdmin()
  const PLAN_VALUES = { classic: 1500, premium: 3000, family: 5000 }

  const { data: referrals } = await sb
    .from('referrals')
    .select('veteran_actor_id, actor_name, referral_code, referred_user_id')
    .eq('is_active', true)

  if (!referrals?.length) return res.json({ message: 'No active referrals', period })

  const actorEarnings = {}
  for (const ref of referrals) {
    const { data: user } = await sb.from('users').select('plan, plan_status').eq('id', ref.referred_user_id).single()
    if (!user || user.plan_status !== 'active') continue
    const planValue = PLAN_VALUES[user.plan] || 0
    const earned = parseFloat((planValue * REFERRAL_PCT).toFixed(2))
    const key = ref.veteran_actor_id || ref.actor_name
    if (!actorEarnings[key]) actorEarnings[key] = { veteran_actor_id: ref.veteran_actor_id, actor_name: ref.actor_name, referral_code: ref.referral_code, active_referrals: 0, revenue_from_referrals_ngn: 0, earned_ngn: 0 }
    actorEarnings[key].active_referrals += 1
    actorEarnings[key].revenue_from_referrals_ngn += planValue
    actorEarnings[key].earned_ngn += earned
  }

  const records = Object.values(actorEarnings).map(a => ({ period, ...a, pct: REFERRAL_PCT * 100, status: 'calculated' }))
  await sb.from('referral_earnings').insert(records)

  return res.json({ success: true, period, actors_with_referrals: records.length, total_referral_payout_ngn: records.reduce((s, r) => s + r.earned_ngn, 0), records })
}
