// pages/api/admin/reels/activate.js
import { createServerSupabaseClient, supabaseAdmin, logActivity } from '../../../../lib/supabase'
import { getVideo } from '../../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { reelId } = req.body
  if (!reelId) return res.status(400).json({ error: 'Missing reelId' })

  try {
    const sb = supabaseAdmin()
    await sb.from('movie_reels').update({ is_active: true }).eq('id', reelId)

    const { data: reel } = await sb.from('movie_reels').select('title, bunny_video_guid').eq('id', reelId).single()
    if (reel?.bunny_video_guid) {
      try {
        const bunnyVideo = await getVideo(reel.bunny_video_guid)
        if (bunnyVideo.length) await sb.from('movie_reels').update({ duration_seconds: bunnyVideo.length }).eq('id', reelId)
      } catch (err) {
        console.error('Reel duration sync failed (non-blocking):', err)
      }
    }

    await logActivity({
      adminEmail: session.user.email,
      action: 'reel.activate',
      targetType: 'reel',
      targetLabel: reel?.title || reelId,
    })

    return res.json({ success: true })
  } catch (err) {
    console.error('Activate reel error:', err)
    return res.status(500).json({ error: err.message })
  }
}
