// pages/api/admin/whoami.js
// Tells the client (Nav, admin pages) whether the current session belongs to an
// admin — without ever exposing ADMIN_EMAILS itself to the browser. This mirrors
// the same check already used in pages/api/admin/upload-url.js and friends, so
// there's one source of truth for "who counts as admin."
import { createServerSupabaseClient } from '../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const supabase = createServerSupabaseClient(req, res)
    const { data: { session } } = await supabase.auth.getSession()

    const isAdmin = !!session && ADMIN_EMAILS.includes(session.user.email)
    return res.status(200).json({ isAdmin })
  } catch (err) {
    // Fail closed — if anything goes wrong, treat the caller as non-admin.
    return res.status(200).json({ isAdmin: false })
  }
}
