
-- Add YouTube trailer ID to movies table (run in Supabase SQL Editor)
alter table public.movies add column if not exists youtube_trailer_id text default null;
-- Usage: set this to the YouTube video ID (e.g. 'dQw4w9WgXcQ')
-- When set, a free preview embed appears on the movie detail modal for all users
-- This lets you hook non-subscribers with free clips at zero streaming cost
