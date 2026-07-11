// pages/api/admin/tus-auth.js
// Returns a short-lived, video-specific signed credential so the browser can
// upload large video files directly to Bunny without ever seeing the
// permanent BUNNY_STREAM_KEY. Admin-gated, same as every other admin route.
import { createServerSupabaseClient } from '../../../lib/supabase'
import { getTusUploadAuth } from '../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { videoGuid } = req.body
  if (!videoGuid) return res.status(400).json({ error: 'Missing videoGuid' })

  try {
    const auth = await getTusUploadAuth(videoGuid)
    return res.json(auth)
  } catch (err) {
    console.error('TUS auth error:', err)
    return res.status(500).json({ error: err.message })
  }
}
