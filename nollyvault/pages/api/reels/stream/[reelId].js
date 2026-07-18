// pages/api/reels/stream/[reelId].js
// Public — reels are freely watchable, no subscription check. Still uses a
// signed, time-limited Bunny URL (not a permanent public link) to avoid
// hotlinking/leeching the video file itself.
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSignedStreamUrl } from '../../../../lib/bunny'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { reelId } = req.query

  try {
    const sb = supabaseAdmin()
    const { data: reel, error } = await sb
      .from('movie_reels')
      .select('id, title, bunny_video_guid, duration_seconds, view_count, is_active')
      .eq('id', reelId)
      .single()
    if (error || !reel) return res.status(404).json({ error: 'Reel not found' })
    if (!reel.is_active) return res.status(403).json({ error: 'Reel not available' })
    if (!reel.bunny_video_guid) return res.status(400).json({ error: 'Reel has no video attached yet' })

    const streamUrl = await getSignedStreamUrl(reel.bunny_video_guid)
    // Fire-and-forget view count bump — not critical if this occasionally races
    sb.from('movie_reels').update({ view_count: (reel.view_count || 0) + 1 }).eq('id', reelId).then(()=>{})

    return res.json({ streamUrl, title: reel.title, duration_seconds: reel.duration_seconds })
  } catch (err) {
    console.error('Reel stream error:', err)
    return res.status(500).json({ error: err.message })
  }
}
