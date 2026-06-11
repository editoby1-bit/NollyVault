// GET /api/ads/reel?plan=classic
// Classic plan sees ads. Premium and Family are ad-free.
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { plan } = req.query
  if (plan === 'premium' || plan === 'family') return res.json({ ads: [], ad_free: true })
  try {
    const sb = supabaseAdmin()
    const { data: ads } = await sb.from('ads')
      .select('id,title,type,brand_name,youtube_video_id,bunny_video_id,duration_seconds,is_skippable,skip_after_seconds')
      .eq('is_active', true)
      .lte('display_from', new Date().toISOString())
      .order('type')
    return res.json({ ads: ads || [], ad_free: false })
  } catch { return res.json({ ads: [], ad_free: false }) }
}
