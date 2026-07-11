// pages/api/admin/activate-movie.js
// Flips is_active to true once a video's file has actually finished
// uploading to Bunny. Nothing else in the codebase ever did this — movies
// were previously created with is_active: false and stayed invisible
// forever, since useMovies() filters .eq('is_active', true).
import { createServerSupabaseClient, supabaseAdmin } from '../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId, isAd = false } = req.body
  if (!movieId) return res.status(400).json({ error: 'Missing movieId' })

  try {
    const sb = supabaseAdmin()
    const table = isAd ? 'retro_ads' : 'movies'
    await sb.from(table).update({ is_active: true }).eq('id', movieId)
    return res.json({ success: true })
  } catch (err) {
    console.error('Activate movie error:', err)
    return res.status(500).json({ error: err.message })
  }
}
