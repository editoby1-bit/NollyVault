// pages/api/progress.js
// POST: save progress. GET: get continue-watching list.
import { createServerSupabaseClient, supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'POST') {
    const { movieId, profileId, progressSeconds, completed } = req.body

    const { error } = await supabase
      .from('watch_history')
      .upsert({
        profile_id: profileId,
        movie_id: movieId,
        progress_seconds: progressSeconds,
        completed: completed || false,
        watched_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,movie_id' })

    if (error) return res.status(500).json({ error: error.message })

    // Also keep play_events.minutes_watched current — this is what the
    // royalty calculation actually reads. It was previously hardcoded to 0
    // and never updated anywhere, meaning royalty calculation would always
    // see zero total minutes regardless of real viewing.
    const period = new Date().toISOString().slice(0, 7)
    await supabaseAdmin()
      .from('play_events')
      .update({ minutes_watched: Math.floor(progressSeconds / 60) })
      .eq('movie_id', movieId)
      .eq('user_id', session.user.id)
      .eq('period', period)

    return res.json({ saved: true })
  }

  if (req.method === 'GET') {
    const { profileId, movieId } = req.query

    // Single-movie lookup, used by the watch page to resume playback
    if (movieId) {
      const { data, error } = await supabase
        .from('watch_history')
        .select('progress_seconds, completed')
        .eq('profile_id', profileId)
        .eq('movie_id', movieId)
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ progress: data || null })
    }

    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        progress_seconds,
        completed,
        watched_at,
        movies (id, title, year, category, thumbnail_url, duration_seconds, bunny_video_guid)
      `)
      .eq('profile_id', profileId)
      .eq('completed', false)
      .order('watched_at', { ascending: false })
      .limit(10)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ continueWatching: data })
  }

  return res.status(405).end()
}
