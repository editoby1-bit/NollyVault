// pages/api/admin/logs/list.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return res.json({ logs: data || [] })
  } catch (err) {
    console.error('List logs error:', err)
    return res.status(500).json({ error: err.message })
  }
}
