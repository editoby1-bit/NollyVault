// ─── Cloudflare Stream helpers ────────────────────────────────────────────────
// Docs: https://developers.cloudflare.com/stream/

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`
const CF_HEADERS = {
  Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`,
  'Content-Type': 'application/json',
}

/**
 * Generate a signed URL for a video so only paying subscribers can watch.
 * The token expires after `expiresIn` seconds (default 4 hours).
 */
export async function getSignedStreamUrl(videoUid, expiresIn = 14400) {
  const res = await fetch(`${CF_BASE}/${videoUid}/token`, {
    method: 'POST',
    headers: CF_HEADERS,
    body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresIn }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('Failed to generate stream token')
  // Return iframe embed URL with signed token
  return `https://iframe.cloudflarestream.com/${data.result.token}`
}

/**
 * Get a one-time upload URL for the admin panel.
 * After upload, Cloudflare auto-encodes to multiple qualities (SD/HD/4K).
 */
export async function getUploadUrl(maxDurationSeconds = 10800) {
  const res = await fetch(`${CF_BASE}/direct_upload`, {
    method: 'POST',
    headers: CF_HEADERS,
    body: JSON.stringify({
      maxDurationSeconds,
      requireSignedURLs: true, // DRM — only signed URLs can play
    }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('Failed to create upload URL')
  return {
    uploadUrl: data.result.uploadURL,
    videoUid: data.result.uid,
  }
}

/**
 * Update video metadata (title, thumbnail, etc.) after upload
 */
export async function updateVideoMetadata(videoUid, meta = {}) {
  const res = await fetch(`${CF_BASE}/${videoUid}`, {
    method: 'POST',
    headers: CF_HEADERS,
    body: JSON.stringify(meta),
  })
  return res.json()
}

/**
 * List all videos in the account (for admin panel)
 */
export async function listVideos() {
  const res = await fetch(`${CF_BASE}?status=ready`, { headers: CF_HEADERS })
  const data = await res.json()
  return data.result || []
}
