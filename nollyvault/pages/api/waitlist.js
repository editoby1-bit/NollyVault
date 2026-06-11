// pages/api/waitlist.js
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, source } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })

  const sb = supabaseAdmin()

  // Upsert to avoid duplicate error if email already exists
  const { error } = await sb.from('waitlist').upsert({
    email: email.toLowerCase().trim(),
    source: source || 'landing',
    signed_up_at: new Date().toISOString(),
  }, { onConflict: 'email' })

  if (error) {
    console.error('Waitlist error:', error)
    return res.status(500).json({ error: 'Failed to save' })
  }

  // Optional: send welcome email via Resend
  // await sendWelcomeEmail(email)

  return res.json({ success: true })
}
