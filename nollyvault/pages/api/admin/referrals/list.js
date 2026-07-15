// pages/api/admin/referrals/list.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const sb = supabaseAdmin()
    const [codesRes, earningsRes] = await Promise.all([
      sb.from('actor_referral_codes').select('*').order('created_at', { ascending: false }),
      sb.from('referral_earnings').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    if (codesRes.error) throw codesRes.error
    if (earningsRes.error) throw earningsRes.error
    return res.json({ codes: codesRes.data || [], earnings: earningsRes.data || [] })
  } catch (err) {
    console.error('List referrals error:', err)
    return res.status(500).json({ error: err.message })
  }
}
