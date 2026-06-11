// POST /api/advertise — handles brand partnership enquiry form
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { brand, name, email, phone, package: pkg, message } = req.body
  if (!brand || !email) return res.status(400).json({ error: 'Missing required fields' })

  try {
    const sb = supabaseAdmin()

    // Save enquiry to Supabase
    await sb.from('brand_sponsors').insert({
      brand_name: brand,
      contact_name: name,
      contact_email: email,
      notes: `Package: ${pkg}\nPhone: ${phone || 'N/A'}\nMessage: ${message || 'N/A'}`,
      is_active: false, // pending review
    })

    // TODO: Send notification email to admin
    // await sendEmail({ to: 'advertise@naijarewind.com', subject: `New ad enquiry from ${brand}`, ... })

    return res.json({ success: true })
  } catch (err) {
    console.error('Advertise API error:', err)
    // Still return success to user — don't expose DB errors
    return res.json({ success: true })
  }
}
