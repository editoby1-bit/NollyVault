// pages/api/admin/activate-movie.js
// Flips is_active to true once a video's file has actually finished
// uploading to Bunny. Nothing else in the codebase ever did this — movies
// were previously created with is_active: false and stayed invisible
// forever, since useMovies() filters .eq('is_active', true).
import { createServerSupabaseClient, supabaseAdmin, logActivity } from '../../../lib/supabase'
import { getVideo } from '../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId, isAd = false, setActive = true } = req.body
  if (!movieId) return res.status(400).json({ error: 'Missing movieId' })

  try {
    const sb = supabaseAdmin()
    const table = isAd ? 'retro_ads' : 'movies'
    await sb.from(table).update({ is_active: !!setActive }).eq('id', movieId)

    // Best-effort duration sync — Bunny may still be encoding right after
    // upload finishes, so this can silently miss; the admin panel's manual
    // "Sync Duration" button is the reliable fallback for that case.
    if (!isAd && setActive) {
      try {
        const { data: m } = await sb.from(table).select('bunny_video_guid, duration_seconds').eq('id', movieId).single()
        if (m?.bunny_video_guid && !m.duration_seconds) {
          const bunnyVideo = await getVideo(m.bunny_video_guid)
          if (bunnyVideo.length) await sb.from(table).update({ duration_seconds: bunnyVideo.length }).eq('id', movieId)
        }
      } catch (err) {
        console.error('Auto duration sync failed (non-blocking):', err)
      }
    }

    const { data: row } = await sb.from(table).select('title').eq('id', movieId).single()
    await logActivity({
      adminEmail: session.user.email,
      action: setActive ? `${isAd ? 'ad' : 'movie'}.activate` : `${isAd ? 'ad' : 'movie'}.hide`,
      targetType: isAd ? 'ad' : 'movie',
      targetLabel: row?.title || movieId,
    })

    return res.json({ success: true })
  } catch (err) {
    console.error('Activate movie error:', err)
    return res.status(500).json({ error: err.message })
  }
}
