// pages/api/reels/stream/[reelId].js
// Reels are subscriber-only, same entitlement check as full movies — not
// free. The free discovery/teaser experience lives separately via YouTube
// embeds (no Bunny cost, no login required), not through this route.
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'
import { getSignedStreamUrl } from '../../../../lib/bunny'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { reelId } = req.query

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Sign in required', redirect: '/login' })

  try {
    const sb = supabaseAdmin()
    const { data: user } = await sb.from('users').select('plan_status').eq('id', session.user.id).single()
    if (user?.plan_status !== 'active') {
      return res.status(403).json({ error: 'Subscription required', redirect: '/pricing' })
    }

    const { data: reel, error } = await sb
      .from('movie_reels')
      .select('id, title, bunny_video_guid, duration_seconds, view_count, is_active')
      .eq('id', reelId)
      .single()
    if (error || !reel) return res.status(404).json({ error: 'Reel not found' })
    if (!reel.is_active) return res.status(403).json({ error: 'Reel not available' })
    if (!reel.bunny_video_guid) return res.status(400).json({ error: 'Reel has no video attached yet' })

    const streamUrl = await getSignedStreamUrl(reel.bunny_video_guid)
    sb.from('movie_reels').update({ view_count: (reel.view_count || 0) + 1 }).eq('id', reelId).then(()=>{})

    return res.json({ streamUrl, title: reel.title, duration_seconds: reel.duration_seconds })
  } catch (err) {
    console.error('Reel stream error:', err)
    return res.status(500).json({ error: err.message })
  }
}
