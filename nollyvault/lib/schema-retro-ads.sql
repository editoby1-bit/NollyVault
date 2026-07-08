-- ═══════════════════════════════════════════════════════════════════════════
-- NaijaRewind — Retro Ads System
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── RETRO ADS TABLE ─────────────────────────────────────────────────────────
create table if not exists public.retro_ads (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  brand text,                          -- e.g. 'Indomie', 'Peak Milk'
  year integer,
  ad_type text check (ad_type in (
    'brand_commercial',                -- old Nigerian TV commercials
    'nollywood_trailer',               -- old Nollywood movie trailers with voiceover
    'retro_tv_ad',                     -- general retro TV ads
    'modern_brand_retro'               -- modern brand in retro style
  )) default 'brand_commercial',
  description text,
  bunny_video_guid text,              -- for hosted video
  youtube_video_id text,              -- for YouTube-sourced content (free hosting)
  thumbnail_url text,
  duration_seconds integer,
  is_active boolean default false,
  is_preroll boolean default false,   -- appears before movies
  is_browseable boolean default true, -- appears in Retro Ads browse section
  tags text[],                        -- ['peak_milk', '90s', 'nostalgic']
  view_count integer default 0,
  created_at timestamptz default now()
);

-- ─── AD SLOTS — which ads play before which movies ────────────────────────
-- Pre-roll sequence: brand sponsor ad → retro commercial → nollywood trailer → film
create table if not exists public.preroll_slots (
  id uuid default uuid_generate_v4() primary key,
  slot_order integer not null,         -- 1, 2, 3 = order in the pre-roll sequence
  slot_type text check (slot_type in (
    'brand_sponsor',                   -- paid modern brand ad
    'retro_commercial',                -- old TV commercial
    'nollywood_trailer',               -- old movie trailer with hype voiceover
    'platform_promo'                   -- NaijaRewind own promo
  )) not null,
  ad_id uuid references public.retro_ads(id),
  is_skippable boolean default false,  -- Classic plan: not skippable, Premium+: skippable
  duration_cap_seconds integer default 30,
  active_from timestamptz default now(),
  active_until timestamptz,            -- null = permanent
  created_at timestamptz default now()
);

-- ─── BRAND SPONSORSHIP DEALS ─────────────────────────────────────────────────
create table if not exists public.brand_sponsors (
  id uuid default uuid_generate_v4() primary key,
  brand_name text not null,
  contact_name text,
  contact_email text,
  monthly_fee_ngn numeric(12,2),
  ad_id uuid references public.retro_ads(id),  -- their pre-roll ad
  slot_type text default 'brand_sponsor',
  start_date date,
  end_date date,
  is_active boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.brand_sponsors enable row level security;
-- No policies added — only written to via the service-role key in
-- pages/api/advertise.js. RLS on + zero policies locks the anon key
-- (public, shipped to every browser) out of brand contact info entirely.

alter table public.retro_ads enable row level security;
alter table public.preroll_slots enable row level security;
-- Locked too, even though nothing queries these yet — the pre-roll feature
-- these power hasn't been built. Leaving a table open "until something needs
-- protecting" means anyone with the public anon key can write to it in the
-- meantime, and preroll_slots controls what ad sequence plays before every
-- film — not worth the risk of forgetting to come back to this later.

-- ─── AD VIEW TRACKING ────────────────────────────────────────────────────────
create table if not exists public.ad_views (
  id uuid default uuid_generate_v4() primary key,
  ad_id uuid references public.retro_ads(id),
  user_id uuid references public.users(id),
  movie_id uuid references public.movies(id),  -- which movie they were about to watch
  viewed_at timestamptz default now(),
  completed boolean default false,             -- watched the full ad
  period text                                  -- '2024-06' for monthly reporting
);

alter table public.ad_views enable row level security;
-- No policies added — ties a user_id to their viewing behavior, which is
-- private. Not queried from the client anywhere yet; will go through the
-- service-role key when the pre-roll tracking API route is built, same
-- pattern as brand_sponsors above.

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists idx_retro_ads_type_active on public.retro_ads (ad_type, is_active);
create index if not exists idx_retro_ads_preroll_active on public.retro_ads (is_preroll, is_active);
create index if not exists idx_preroll_slots_order_active on public.preroll_slots (slot_order, active_from);
create index if not exists idx_ad_views_period_ad on public.ad_views (period, ad_id);
create index if not exists idx_brand_sponsors_active on public.brand_sponsors (is_active);

-- ─── SEED DEFAULT PRE-ROLL SLOT ORDER ─────────────────────────────────────
-- The VHS-era pre-film experience:
-- Slot 1: Brand sponsor (modern brand, retro-styled) — 30 seconds
-- Slot 2: Old Nigerian TV commercial (nostalgia) — 30 seconds  
-- Slot 3: Old Nollywood movie trailer with hype voiceover — 60 seconds
-- Film begins
insert into public.preroll_slots (slot_order, slot_type, is_skippable, duration_cap_seconds)
values
  (1, 'brand_sponsor', false, 30),
  (2, 'retro_commercial', false, 30),
  (3, 'nollywood_trailer', false, 60)
on conflict do nothing;
