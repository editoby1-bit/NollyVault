// pages/api/admin/veterans/update.js
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { id, name, bio, birthYear, stateOfOrigin, careerStartYear, careerHighlights, status, isVerified } = req.body
  if (!id || !name) return res.status(400).json({ error: 'Missing id or name' })

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.from('veteran_actors').update({
      name,
      bio: bio || null,
      birth_year: birthYear ? Number(birthYear) : null,
      state_of_origin: stateOfOrigin || null,
      career_start_year: careerStartYear ? Number(careerStartYear) : null,
      career_highlights: careerHighlights ? careerHighlights.split(',').map(s=>s.trim()).filter(Boolean) : null,
      status: status || 'uncontacted',
      is_verified: !!isVerified,
    }).eq('id', id).select().single()
    if (error) throw error
    return res.json({ success: true, actor: data })
  } catch (err) {
    console.error('Update veteran actor error:', err)
    return res.status(500).json({ error: err.message })
  }
}
