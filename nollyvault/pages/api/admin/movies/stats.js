// pages/api/admin/movies/stats.js
// Real aggregated watch-time per movie, summed across all play_events
// (all-time, not just current month) — used by the admin Movies tab.
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.from('play_events').select('movie_id, minutes_watched')
    if (error) throw error

    const totals = {}
    for (const row of data || []) {
      totals[row.movie_id] = (totals[row.movie_id] || 0) + (row.minutes_watched || 0)
    }
    return res.json({ minutesByMovie: totals })
  } catch (err) {
    console.error('Movie stats error:', err)
    return res.status(500).json({ error: err.message })
  }
}
