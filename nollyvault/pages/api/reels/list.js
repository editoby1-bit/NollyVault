// pages/api/reels/list.js
// Public — no auth/subscription required. Reels are a discovery hook, same
// spirit as a trailer being freely watchable.
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('movie_reels')
      .select('id, title, duration_seconds, view_count, movie_id, movies(title, category, thumbnail_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ reels: data || [] })
  } catch (err) {
    console.error('Public reels list error:', err)
    return res.status(500).json({ error: err.message })
  }
}
