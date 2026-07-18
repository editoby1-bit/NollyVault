// pages/api/admin/reels/create.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'
import { createVideo } from '../../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId, title } = req.body
  if (!movieId || !title) return res.status(400).json({ error: 'Missing movieId or title' })

  try {
    const sb = supabaseAdmin()
    const bunnyVideo = await createVideo(title)
    if (!bunnyVideo?.guid) throw new Error('Could not create Bunny video placeholder')

    const { data: inserted, error } = await sb.from('movie_reels').insert({
      movie_id: movieId, title, bunny_video_guid: bunnyVideo.guid, is_active: false,
    }).select('id').single()
    if (error) throw error

    return res.json({ reelId: inserted.id, bunny_video_guid: bunnyVideo.guid })
  } catch (err) {
    console.error('Create reel error:', err)
    return res.status(500).json({ error: err.message })
  }
}
