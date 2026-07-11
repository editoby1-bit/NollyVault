// ─── Bunny.net Video Hosting & Stream CDN ────────────────────────────────────
// Docs: https://docs.bunny.net/reference/video-library
// ~12x cheaper than Cloudflare Stream for delivery
// $0.0055/GB delivered + $0.005/GB stored

const BUNNY_API_KEY     = process.env.BUNNY_API_KEY       // Main account API key
const BUNNY_LIBRARY_ID  = process.env.BUNNY_LIBRARY_ID    // Video library ID
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME  // e.g. naijarewind.b-cdn.net
const BUNNY_STREAM_KEY  = process.env.BUNNY_STREAM_KEY    // Library API key (different from account key)

const STREAM_BASE = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`
const STREAM_HEADERS = {
  AccessKey: BUNNY_STREAM_KEY,
  'Content-Type': 'application/json',
}

/**
 * Get a video's stream URL.
 * Bunny.net uses signed token URLs when DRM is enabled.
 * Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 */
export function getStreamEmbedUrl(videoId, options = {}) {
  const { autoplay = false, preload = false, quality = 'auto' } = options
  const params = new URLSearchParams({
    autoplay: autoplay ? 'true' : 'false',
    loop: 'false',
    muted: 'false',
    preload: preload ? 'true' : 'false',
  })
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?${params}`
}

/**
 * Get a signed stream URL for DRM-protected content (subscribers only)
 * Bunny.net token auth: expires in 4 hours by default
 */
export async function getSignedStreamUrl(videoId, expiresInSeconds = 14400) {
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds
  // Generate HMAC-SHA256 token
  const { createHmac } = await import('crypto')
  const token = createHmac('sha256', BUNNY_STREAM_KEY || '')
    .update(`${BUNNY_LIBRARY_ID}${videoId}${expiry}`)
    .digest('hex')

  const params = new URLSearchParams({
    token,
    expires: expiry.toString(),
    autoplay: 'false',
  })
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?${params}`
}

/**
 * Get a direct upload URL for a new video
 */
export async function createVideo(title, collectionId = null) {
  const body = { title }
  if (collectionId) body.collectionId = collectionId

  const res = await fetch(`${STREAM_BASE}/videos`, {
    method: 'POST',
    headers: STREAM_HEADERS,
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.guid) throw new Error('Failed to create video: ' + JSON.stringify(data))
  return data // { guid, title, status, ... }
}

/**
 * Upload video file directly to Bunny.net
 * (For large files, use tus resumable upload instead)
 */
export async function uploadVideo(videoGuid, fileBuffer) {
  const res = await fetch(`${STREAM_BASE}/videos/${videoGuid}`, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STREAM_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  })
  return res.json()
}

/**
 * Generate a signed TUS upload authorization for a video.
 * This is Bunny's documented pattern for letting the BROWSER upload large
 * files directly to Bunny, without ever exposing the permanent
 * BUNNY_STREAM_KEY to client-side code. The signature is time-limited
 * (default 1 hour) and only valid for this one specific video.
 * Docs: https://docs.bunny.net/docs/stream-uploading#tus-resumable-uploads
 */
export async function getTusUploadAuth(videoGuid, expiresInSeconds = 3600) {
  const { createHash } = await import('crypto')
  const expire = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = createHash('sha256')
    .update(`${BUNNY_LIBRARY_ID}${BUNNY_STREAM_KEY}${expire}${videoGuid}`)
    .digest('hex')

  return {
    endpoint: 'https://video.bunnycdn.com/tusupload',
    videoId: videoGuid,
    libraryId: BUNNY_LIBRARY_ID,
    authorizationSignature: signature,
    authorizationExpire: expire,
  }
}

/**
 * Get video details including encoding status
 * Status: 0=queued, 1=processing, 2=encoding, 3=finished, 4=error
 */
export async function getVideo(videoGuid) {
  const res = await fetch(`${STREAM_BASE}/videos/${videoGuid}`, {
    headers: { AccessKey: BUNNY_STREAM_KEY },
  })
  return res.json()
}

/**
 * List all videos in the library
 */
export async function listVideos(page = 1, perPage = 100) {
  const res = await fetch(`${STREAM_BASE}/videos?page=${page}&itemsPerPage=${perPage}&orderBy=date`, {
    headers: { AccessKey: BUNNY_STREAM_KEY },
  })
  return res.json()
}

/**
 * Delete a video
 */
export async function deleteVideo(videoGuid) {
  const res = await fetch(`${STREAM_BASE}/videos/${videoGuid}`, {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_STREAM_KEY },
  })
  return res.json()
}

/**
 * Get thumbnail URL for a video
 * Bunny.net auto-generates thumbnails during encoding
 */
export function getThumbnailUrl(videoGuid) {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoGuid}/thumbnail.jpg`
}

/**
 * Get video preview (short animated GIF/WebP)
 */
export function getPreviewUrl(videoGuid) {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoGuid}/preview.webp`
}

/**
 * Create a collection (e.g. "Horror", "Village Drama", "Retro Ads")
 */
export async function createCollection(name) {
  const res = await fetch(`${STREAM_BASE}/collections`, {
    method: 'POST',
    headers: STREAM_HEADERS,
    body: JSON.stringify({ name }),
  })
  return res.json()
}

/**
 * Estimate monthly cost for a given subscriber count
 * Based on 1.5GB/user/day average, $0.0055/GB, ₦1600/$
 */
export function estimateMonthlyCost(subscriberCount, avgGBPerDay = 1.5) {
  const totalGB = subscriberCount * avgGBPerDay * 30
  const costUSD = totalGB * 0.0055
  const costNGN = costUSD * 1600
  return {
    totalGB: Math.round(totalGB),
    costUSD: parseFloat(costUSD.toFixed(2)),
    costNGN: Math.round(costNGN),
    perSubNGN: Math.round(costNGN / subscriberCount),
  }
}
