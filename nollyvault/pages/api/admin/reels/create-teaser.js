// pages/api/admin/reels/create-teaser.js
// Free teasers use YouTube directly — no Bunny video, no encoding wait,
// goes live immediately. Separate from the paid upload flow entirely.
import { createServerSupabaseClient, supabaseAdmin, logActivity } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId, title, youtubeVideoId } = req.body
  if (!movieId || !title || !youtubeVideoId) return res.status(400).json({ error: 'Missing movieId, title, or youtubeVideoId' })

  try {
    const sb = supabaseAdmin()
    // Accept either a raw ID or a full YouTube URL — extract just the ID
    const idMatch = youtubeVideoId.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
    const cleanId = idMatch ? idMatch[1] : youtubeVideoId.trim()

    const { data, error } = await sb.from('movie_reels').insert({
      movie_id: movieId, title, youtube_video_id: cleanId, is_active: true,
    }).select().single()
    if (error) throw error

    await logActivity({
      adminEmail: session.user.email,
      action: 'teaser.create',
      targetType: 'reel',
      targetLabel: title,
    })

    return res.json({ success: true, reel: data })
  } catch (err) {
    console.error('Create teaser error:', err)
    return res.status(500).json({ error: err.message })
  }
}
