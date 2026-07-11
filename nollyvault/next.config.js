/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudflare domains and via.placeholder.com removed — this project
      // uses Bunny.net for video/images now, and via.placeholder.com is a
      // dead service (shut down), which is why fallback thumbnails were
      // showing as broken images across the app until this was found.
      ...(process.env.BUNNY_CDN_HOSTNAME
        ? [{ protocol: 'https', hostname: process.env.BUNNY_CDN_HOSTNAME }]
        : []),
    ],
  },
}

module.exports = nextConfig
