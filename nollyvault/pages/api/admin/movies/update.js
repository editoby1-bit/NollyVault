// pages/api/admin/movies/update.js
import { createServerSupabaseClient, supabaseAdmin, logActivity } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId, title, year, producer, category, description } = req.body
  if (!movieId || !title) return res.status(400).json({ error: 'Missing movieId or title' })

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.from('movies').update({
      title, year: year ? Number(year) : null, producer, category, description,
    }).eq('id', movieId).select().single()
    if (error) throw error

    await logActivity({
      adminEmail: session.user.email,
      action: 'movie.update',
      targetType: 'movie',
      targetLabel: title,
    })

    return res.json({ success: true, movie: data })
  } catch (err) {
    console.error('Update movie error:', err)
    return res.status(500).json({ error: err.message })
  }
}
