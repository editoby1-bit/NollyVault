// pages/api/admin/upload-url.js
// Creates a new video in Bunny.net library and returns upload details
import { createServerSupabaseClient } from '../../../lib/supabase'
import { createVideo } from '../../../lib/bunny'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const {
    title, year, category, description,
    producer, producerId, durationSeconds,
    isAd = false, adType = null, // for retro ads
  } = req.body

  try {
    // Create video entry in Bunny.net
    const bunnyVideo = await createVideo(title)

    // Pre-create the movie row in Supabase
    const table = isAd ? 'retro_ads' : 'movies'
    const insertData = isAd ? {
      title,
      ad_type: adType, // 'brand_commercial' | 'nollywood_trailer' | 'retro_tv_ad'
      year: year || null,
      bunny_video_guid: bunnyVideo.guid,
      is_active: false, // activated after Bunny finishes encoding
    } : {
      title, year, category, description,
      producer,
      producer_id: producerId || null,
      duration_seconds: durationSeconds || null,
      bunny_video_guid: bunnyVideo.guid,
      is_active: false,
    }

    const { data: inserted, error: insertErr } = await supabase.from(table).insert(insertData).select('id').single()
    if (insertErr) throw insertErr

    return res.json({
      movieId: inserted.id,
      bunny_video_guid: bunnyVideo.guid,
      bunny_video_id: bunnyVideo.guid,
      // Upload instructions:
      // PUT https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{guid}
      // with header: AccessKey: {BUNNY_STREAM_KEY}
      // body: raw video file bytes
      upload_url: `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${bunnyVideo.guid}`,
      instructions: 'PUT the video file to upload_url with AccessKey header set to BUNNY_STREAM_KEY',
    })
  } catch (err) {
    console.error('Upload URL error:', err)
    return res.status(500).json({ error: err.message })
  }
}
