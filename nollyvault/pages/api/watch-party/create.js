// pages/api/watch-party/create.js
import { createServerSupabaseClient } from '../../../lib/supabase'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase() // e.g. "XK39F2"
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  // Must be on Family & Friends plan
  const { data: user } = await supabase
    .from('users')
    .select('plan, plan_status')
    .eq('id', session.user.id)
    .single()

  if (user?.plan !== 'family' || user?.plan_status !== 'active') {
    return res.status(403).json({
      error: 'Watch Parties require the Family & Friends plan',
      redirect: '/pricing',
    })
  }

  const { movieId, profileId, title, mode } = req.body

  const { data: party, error } = await supabase
    .from('watch_parties')
    .insert({
      movie_id: movieId,
      host_profile_id: profileId,
      title: title || 'Watch Party',
      mode: mode || 'party',
      invite_code: generateInviteCode(),
      is_live: true,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Add host as first member
  await supabase.from('watch_party_members').insert({
    party_id: party.id,
    profile_id: profileId,
  })

  return res.json({ party })
}
