// pages/api/admin/movies/delete.js
import { createServerSupabaseClient, supabaseAdmin, logActivity } from '../../../../lib/supabase'

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
    const { data: movie } = await sb.from('movies').select('title, bunny_video_guid').eq('id', movieId).single()

    // Delete the actual video from Bunny too — otherwise it keeps costing
    // storage forever with nothing in the app pointing to it.
    if (movie?.bunny_video_guid) {
      try {
        await fetch(`https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${movie.bunny_video_guid}`, {
          method: 'DELETE',
          headers: { AccessKey: process.env.BUNNY_STREAM_KEY },
        })
      } catch (err) {
        console.error('Bunny video delete failed (continuing with DB delete):', err)
      }
    }

    await sb.from('movies').delete().eq('id', movieId)

    await logActivity({
      adminEmail: session.user.email,
      action: 'movie.delete',
      targetType: 'movie',
      targetLabel: movie?.title || movieId,
      details: 'Permanently deleted, including Bunny video',
    })

    return res.json({ success: true })
  } catch (err) {
    console.error('Delete movie error:', err)
    return res.status(500).json({ error: err.message })
  }
}
