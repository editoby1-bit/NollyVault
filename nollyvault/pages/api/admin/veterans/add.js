// pages/api/admin/veterans/add.js
// Adds a veteran actor to the honor roll. Intentionally has nothing to do
// with movie licensing or rights — honoring an actor's legacy doesn't
// require having secured streaming rights to their films.
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { name, bio, birthYear, stateOfOrigin, careerStartYear, careerHighlights, status } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.from('veteran_actors').insert({
      name,
      bio: bio || null,
      birth_year: birthYear ? Number(birthYear) : null,
      state_of_origin: stateOfOrigin || null,
      career_start_year: careerStartYear ? Number(careerStartYear) : null,
      career_highlights: careerHighlights ? careerHighlights.split(',').map(s=>s.trim()).filter(Boolean) : null,
      status: status || 'uncontacted',
    }).select().single()
    if (error) throw error
    return res.json({ success: true, actor: data })
  } catch (err) {
    console.error('Add veteran actor error:', err)
    return res.status(500).json({ error: err.message })
  }
}
