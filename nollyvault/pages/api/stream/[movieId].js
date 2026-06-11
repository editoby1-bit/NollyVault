// pages/api/stream/[movieId].js
// Returns a signed Bunny.net stream URL — only for active subscribers
import { createServerSupabaseClient, supabaseAdmin } from '../../../lib/supabase'
import { getSignedStreamUrl } from '../../../lib/bunny'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // 1. Auth check
  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  // 2. Subscription check
  const { data: user } = await supabase
    .from('users')
    .select('plan, plan_status, monthly_watch_minutes')
    .eq('id', session.user.id)
    .single()

  if (!user || user.plan_status !== 'active') {
    return res.status(403).json({ error: 'No active subscription', redirect: '/pricing' })
  }

  // 3. Classic plan watch limit check (20hrs = 1200 minutes/month)
  if (user.plan === 'classic' && (user.monthly_watch_minutes || 0) >= 1200) {
    return res.status(403).json({
      error: 'Monthly watch limit reached on Classic plan',
      limit_reached: true,
      redirect: '/pricing',
      message: 'You have reached your 20hr monthly limit. Upgrade to Premium for unlimited watching.',
    })
  }

  // 4. Get the movie's Bunny.net video GUID
  const { movieId } = req.query
  const { data: movie } = await supabase
    .from('movies')
    .select('bunny_video_guid, title, duration_seconds')
    .eq('id', movieId)
    .eq('is_active', true)
    .single()

  if (!movie?.bunny_video_guid) {
    return res.status(404).json({ error: 'Movie not found or not yet available' })
  }

  // 5. Generate signed stream URL (4-hour expiry)
  try {
    const streamUrl = await getSignedStreamUrl(movie.bunny_video_guid)

    // 6. Log play event for royalty pool + referral tracking
    const sb = supabaseAdmin()
    await sb.from('play_events').insert({
      movie_id: movieId,
      user_id: session.user.id,
      period: new Date().toISOString().slice(0, 7), // '2024-06'
      minutes_watched: 0, // updated client-side via progress API
    })

    return res.json({
      streamUrl,
      title: movie.title,
      duration_seconds: movie.duration_seconds,
    })
  } catch (err) {
    console.error('Stream URL error:', err)
    return res.status(500).json({ error: 'Could not generate stream URL' })
  }
}
