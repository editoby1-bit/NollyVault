-- Add Bunny.net video ID to movies table
-- Run in Supabase SQL Editor
alter table public.movies add column if not exists bunny_video_id text default null;

-- Add to env vars in Vercel:
-- BUNNY_LIBRARY_ID   = your Bunny Stream library ID
-- BUNNY_API_KEY      = your Bunny account API key
-- BUNNY_TOKEN_KEY    = token authentication key from library settings
-- BUNNY_CDN_HOST     = e.g. your-library-id.b-cdn.net (from library settings)
