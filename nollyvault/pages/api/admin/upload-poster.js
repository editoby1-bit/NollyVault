// pages/api/admin/upload-poster.js
// Uploads a custom poster image using Bunny's real, documented "Set
// Thumbnail" endpoint (confirmed via docs.bunny.net, not guessed):
// POST https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}/thumbnail
// This reuses the same Bunny connection already set up for video — no new
// service or env vars needed. Bunny serves the result at a predictable CDN
// path, which is what gets saved as the movie's thumbnail_url.
import { createServerSupabaseClient, supabaseAdmin } from '../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export const config = {
  api: { bodyParser: false }, // we need the raw image bytes, not JSON-parsed
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { movieId } = req.query
  if (!movieId) return res.status(400).json({ error: 'Missing movieId' })

  try {
    const sb = supabaseAdmin()
    const { data: movie, error: movieErr } = await sb.from('movies').select('bunny_video_guid').eq('id', movieId).single()
    if (movieErr || !movie?.bunny_video_guid) throw new Error('Movie or its Bunny video not found')

    const imageBytes = await readRawBody(req)
    if (!imageBytes.length) return res.status(400).json({ error: 'No image data received' })

    const bunnyRes = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${movie.bunny_video_guid}/thumbnail`,
      {
        method: 'POST',
        headers: {
          AccessKey: process.env.BUNNY_STREAM_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBytes,
      }
    )
    const bunnyData = await bunnyRes.json()
    if (!bunnyRes.ok || bunnyData.success === false) {
      throw new Error(bunnyData.message || 'Bunny rejected the thumbnail upload')
    }

    // Bunny's standard CDN path for a video's thumbnail image
    const thumbnailUrl = `https://${process.env.BUNNY_CDN_HOSTNAME}/${movie.bunny_video_guid}/thumbnail.jpg`
    await sb.from('movies').update({ thumbnail_url: thumbnailUrl }).eq('id', movieId)

    return res.json({ success: true, thumbnailUrl })
  } catch (err) {
    console.error('Upload poster error:', err)
    return res.status(500).json({ error: err.message })
  }
}
