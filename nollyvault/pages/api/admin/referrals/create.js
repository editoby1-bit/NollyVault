// pages/api/admin/referrals/create.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { veteranActorId, actorName } = req.body
  if (!veteranActorId || !actorName) return res.status(400).json({ error: 'Missing veteranActorId or actorName' })

  try {
    const sb = supabaseAdmin()
    const namePart = actorName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10)
    const code = `${namePart}${Math.floor(1000 + Math.random() * 9000)}`

    const { data, error } = await sb.from('actor_referral_codes').insert({
      veteran_actor_id: veteranActorId,
      actor_name: actorName,
      code,
    }).select().single()
    if (error) throw error
    return res.json({ success: true, referralCode: data })
  } catch (err) {
    console.error('Create referral code error:', err)
    return res.status(500).json({ error: err.message })
  }
}
