// pages/api/admin/sponsors/toggle.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { sponsorId, setActive } = req.body
  if (!sponsorId) return res.status(400).json({ error: 'Missing sponsorId' })

  try {
    const sb = supabaseAdmin()
    await sb.from('brand_sponsors').update({ is_active: !!setActive }).eq('id', sponsorId)
    return res.json({ success: true })
  } catch (err) {
    console.error('Toggle sponsor error:', err)
    return res.status(500).json({ error: err.message })
  }
}
