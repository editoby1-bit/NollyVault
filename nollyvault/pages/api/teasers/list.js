// pages/api/teasers/list.js — public, no auth, teasers only (youtube_video_id set)
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('movie_reels')
      .select('id, title, youtube_video_id, movie_id, movies(title, category)')
      .eq('is_active', true)
      .not('youtube_video_id', 'is', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ teasers: data || [] })
  } catch (err) {
    console.error('Teasers list error:', err)
    return res.status(500).json({ error: err.message })
  }
}
