// GET /api/ads/retro?type=commercial&page=1
// Returns retro content for the Retro Ads browse section (public — no auth needed)
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { type, page = 1 } = req.query
  const per = 20
  const offset = (parseInt(page) - 1) * per
  try {
    const sb = supabaseAdmin()
    let q = sb.from('retro_content').select('*').eq('is_active', true).order('year')
    if (type && type !== 'all') q = q.eq('type', type)
    q = q.range(offset, offset + per - 1)
    const { data, count } = await q
    return res.json({ items: data || [], total: count || 0, page: parseInt(page) })
  } catch { return res.json({ items: [], total: 0 }) }
}
