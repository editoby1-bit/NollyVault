// GET /api/referral/validate?code=KANAYO2024
// Validates a referral code and returns actor info
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Missing code' })

  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('actor_referral_codes')
    .select('*, veteran_actors(name, profile_image_url)')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Invalid or inactive referral code' })

  return res.json({
    valid: true,
    code: data.code,
    actor_name: data.actor_name,
    actor_image: data.veteran_actors?.profile_image_url || null,
    total_referrals: data.total_referrals,
  })
}
