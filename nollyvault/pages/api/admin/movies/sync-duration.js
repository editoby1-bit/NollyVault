// pages/api/admin/movies/sync-duration.js
// The upload form never actually sent a duration, so every movie has had
// duration_seconds = null since the beginning — which is why progress bars
// never rendered (percentage can't be computed without a real duration).
// This pulls the real duration from Bunny (available once encoding
// finishes) and saves it.
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'
import { getVideo } from '../../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId } = req.body
  if (!movieId) return res.status(400).json({ error: 'Missing movieId' })

  try {
    const sb = supabaseAdmin()
    const { data: movie } = await sb.from('movies').select('bunny_video_guid').eq('id', movieId).single()
    if (!movie?.bunny_video_guid) throw new Error('No Bunny video linked to this movie')

    const bunnyVideo = await getVideo(movie.bunny_video_guid)
    // Bunny reports duration as `length` in seconds once encoding is done.
    // If it's still encoding, length may be 0 or missing — surface that
    // clearly rather than silently saving 0.
    if (!bunnyVideo.length) {
      return res.json({ success: false, error: 'Bunny hasn\'t finished encoding yet — try again shortly' })
    }

    await sb.from('movies').update({ duration_seconds: bunnyVideo.length }).eq('id', movieId)
    return res.json({ success: true, duration_seconds: bunnyVideo.length })
  } catch (err) {
    console.error('Sync duration error:', err)
    return res.status(500).json({ error: err.message })
  }
}
