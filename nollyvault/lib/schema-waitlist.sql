-- Add to schema.sql or run separately in Supabase SQL Editor

-- Waitlist table (for pre-launch signups from landing page)
create table if not exists public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  source text default 'landing',   -- 'landing', 'instagram', 'twitter', 'referral'
  referral_code text,
  signed_up_at timestamptz default now()
);

-- No RLS needed — this is insert-only from API with service role key
