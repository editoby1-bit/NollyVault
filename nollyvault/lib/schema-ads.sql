-- ═══════════════════════════════════════════════════════════════════════════
-- NaijaRewind Ad System Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Ad slots — pre-film reel sequences
create table if not exists public.ads (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in (
    'brand_preroll',      -- modern brand sponsor (30 sec, non-skippable)
    'retro_commercial',   -- old Nigerian TV commercial (YouTube embed or file)
    'movie_trailer',      -- old Nollywood movie trailer with voiceover
    'platform_promo'      -- NaijaRewind own promo
  )) not null,
  brand_name text,                     -- for brand_preroll
  youtube_video_id text,               -- YouTube embed (for retro content — free hosting)
  bunny_video_id text,                 -- Bunny.net (for brand prerolls we host)
  duration_seconds integer default 30,
  is_active boolean default true,
  is_skippable boolean default false,  -- brand prerolls never skippable
  skip_after_seconds integer default null, -- null = never skippable
  display_from timestamptz default now(),
  display_until timestamptz default null, -- null = indefinite
  -- Revenue tracking
  total_impressions integer default 0,
  revenue_ngn numeric(12,2) default 0,
  -- Targeting
  show_to_plans text[] default array['classic'], -- which plans see this ad
  created_at timestamptz default now()
);

-- Monthly ad campaigns
create table if not exists public.ad_campaigns (
  id uuid default uuid_generate_v4() primary key,
  brand_name text not null,
  contact_name text,
  contact_email text,
  plan text check (plan in ('preroll','retro_slot','naming_rights','podcast_sponsor')),
  price_ngn numeric(12,2),
  period_start date,
  period_end date,
  status text check (status in ('enquiry','confirmed','live','completed','cancelled')) default 'enquiry',
  notes text,
  created_at timestamptz default now()
);

-- Pre-film reel — defines the sequence of ads shown before each movie
-- The reel runs in order: brand sponsor → retro commercial → movie trailer → film starts
create table if not exists public.ad_reels (
  id uuid default uuid_generate_v4() primary key,
  name text default 'Default Reel',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.ad_reel_items (
  id uuid default uuid_generate_v4() primary key,
  reel_id uuid references public.ad_reels(id) on delete cascade,
  ad_id uuid references public.ads(id) on delete cascade,
  position integer not null,  -- order in the reel
  created_at timestamptz default now()
);

-- Retro content library (old commercials + movie trailers for the Retro Ads section)
create table if not exists public.retro_content (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text check (type in ('commercial','movie_trailer','jingle','programme_intro')),
  brand text,                  -- for commercials: 'Peak Milk', 'Indomie', 'Bournvita'
  year integer,
  youtube_video_id text,       -- embed via YouTube (free)
  description text,
  is_active boolean default true,
  view_count integer default 0,
  created_at timestamptz default now()
);

-- Seed some retro content placeholders
insert into public.retro_content (title, type, brand, year, youtube_video_id, description) values
  ('Peak Milk — The Family Milk', 'commercial', 'Peak Milk', 1994, null, 'Classic Peak Milk TV commercial with the iconic jingle'),
  ('Indomie — De Original', 'commercial', 'Indomie', 1995, null, 'Original Indomie commercial — "Indomie, de original"'),
  ('Bournvita — Wisdom of a Mother', 'commercial', 'Bournvita', 1993, null, 'Bournvita chocolate drink TV commercial'),
  ('Guinness Nigeria — Made of Black', 'commercial', 'Guinness', 1996, null, 'Classic Guinness Nigeria advert'),
  ('Living in Bondage — Original Trailer', 'movie_trailer', null, 1992, null, 'Original VHS trailer with classic voiceover hype'),
  ('Karishika — Movie Reel', 'movie_trailer', null, 1996, null, 'Fast-paced teaser with dramatic voiceover'),
  ('Glamour Girls — Coming Soon', 'movie_trailer', null, 1994, null, 'Original movie advertisement reel')
on conflict do nothing;

-- Indexes
create index if not exists idx_ads_type_active on public.ads (type, is_active);
create index if not exists idx_retro_content_type_active on public.retro_content (type, is_active);
create index if not exists idx_ad_reel_items_reel_position on public.ad_reel_items (reel_id, position);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- All ad content/campaign tables are only ever queried via the service-role
-- key in pages/api/ads/reel.js and pages/api/ads/retro.js. No client-side
-- direct reads exist for these. RLS on + zero policies locks the public
-- anon key out entirely without affecting how the app actually works.
alter table public.ads enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_reels enable row level security;
alter table public.ad_reel_items enable row level security;
alter table public.retro_content enable row level security;
