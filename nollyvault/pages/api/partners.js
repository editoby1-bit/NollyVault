// POST /api/partners — handles producer / rights-holder licensing enquiry form
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { holderName, name, email, phone, films, proof, message } = req.body
  if (!holderName || !email) return res.status(400).json({ error: 'Missing required fields' })

  try {
    const sb = supabaseAdmin()

    await sb.from('producer_submissions').insert({
      producer_or_rights_holder_name: holderName,
      contact_name: name,
      contact_email: email,
      contact_phone: phone || null,
      films: films || null,
      proof_of_rights: proof || null,
      message: message || null,
      status: 'new',
    })

    // TODO: Send notification email to admin
    // await sendEmail({ to: 'partners@naijarewind.com', subject: `New rights enquiry from ${holderName}`, ... })

    return res.json({ success: true })
  } catch (err) {
    console.error('Partners API error:', err)
    // Still return success to user — don't expose DB errors
    return res.json({ success: true })
  }
}
