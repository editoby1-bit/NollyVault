-- ═══════════════════════════════════════════════════════════════════════════
-- NaijaRewind Database Schema
-- Run this in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── USERS / PROFILES ────────────────────────────────────────────────────────
-- Supabase Auth handles authentication (auth.users).
-- This extends it with app-specific data.

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  plan text check (plan in ('classic', 'premium', 'family')) default null,
  plan_status text check (plan_status in ('active', 'cancelled', 'past_due', 'trialing')) default null,
  paystack_customer_code text,
  paystack_subscription_code text,
  stripe_customer_id text,
  country_code text,                  -- 'NG' for Nigeria, others for diaspora
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sub-profiles within an account (Family & Friends feature)
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  avatar_color text default '#c8a84b',
  avatar_initials text,
  created_at timestamptz default now()
);

-- ─── MOVIES ───────────────────────────────────────────────────────────────────
create table public.movies (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  year integer not null,
  description text,
  category text not null,            -- 'Classic Horror & Occult', 'Village Drama', etc.
  duration_seconds integer,          -- for progress tracking
  cloudflare_video_uid text,         -- deprecated, unused since migrating to Bunny.net — see bunny_video_guid
  bunny_video_guid text,             -- Bunny.net video GUID, set by the admin upload flow
  thumbnail_url text,
  producer text,
  is_featured boolean default false,
  is_active boolean default true,    -- set false to unpublish without deleting
  created_at timestamptz default now()
);

-- Actors linked to movies (many-to-many)
create table public.movie_actors (
  movie_id uuid references public.movies(id) on delete cascade,
  actor_name text not null,
  primary key (movie_id, actor_name)
);

-- ─── WATCH HISTORY & PROGRESS ────────────────────────────────────────────────
create table public.watch_history (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  movie_id uuid references public.movies(id) on delete cascade not null,
  progress_seconds integer default 0,  -- how far they watched
  completed boolean default false,
  watched_at timestamptz default now(),
  unique(profile_id, movie_id)          -- upsert-friendly
);

-- ─── WATCHLISTS ───────────────────────────────────────────────────────────────
create table public.watchlists (
  profile_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (profile_id, movie_id)
);

-- ─── WATCH PARTIES ────────────────────────────────────────────────────────────
create table public.watch_parties (
  id uuid default uuid_generate_v4() primary key,
  movie_id uuid references public.movies(id) on delete cascade not null,
  host_profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  mode text check (mode in ('party', 'date_night', 'family_night')) default 'party',
  is_live boolean default false,
  started_at timestamptz,
  playback_position integer default 0,  -- synced position in seconds
  invite_code text unique,              -- short code guests use to join
  created_at timestamptz default now()
);

create table public.watch_party_members (
  party_id uuid references public.watch_parties(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (party_id, profile_id)
);

-- ─── ROYALTY POOL ─────────────────────────────────────────────────────────────
-- Each play counts as one unit toward the royalty pool distribution.
create table public.play_events (
  id uuid default uuid_generate_v4() primary key,
  movie_id uuid references public.movies(id) on delete cascade not null,
  profile_id uuid references public.profiles(id),
  user_id uuid references public.users(id),
  minutes_watched integer default 0,
  period text,                         -- e.g. '2024-06' for monthly pool calc
  created_at timestamptz default now(),
  unique(movie_id, user_id, period)
);

-- Monthly royalty distribution ledger
create table public.royalty_distributions (
  id uuid default uuid_generate_v4() primary key,
  period text not null,                -- '2024-06'
  movie_id uuid references public.movies(id),
  producer text,
  total_minutes integer default 0,
  pool_share_pct numeric(5,2),         -- % of total minutes this title earned
  amount_ngn numeric(12,2),            -- naira payout
  status text check (status in ('pending', 'paid')) default 'pending',
  created_at timestamptz default now()
);

-- ─── PRODUCERS / PARTNERS ─────────────────────────────────────────────────────
create table public.producers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  bank_name text,
  account_number text,
  account_name text,
  revenue_share_pct numeric(5,2) default 30.00,
  created_at timestamptz default now()
);

-- Link movies to producers for dashboard
alter table public.movies add column producer_id uuid references public.producers(id);

-- Inbound licensing enquiries from the public /partners page, before a producer
-- is verified and onboarded into the `producers` table above. Kept separate
-- since this form has no banking details — just contact + catalog info.
create table public.producer_submissions (
  id uuid default uuid_generate_v4() primary key,
  producer_or_rights_holder_name text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  films text,               -- free text list of titles they hold rights to
  proof_of_rights text,     -- description of what they can provide (contract, CAC cert, etc.)
  message text,
  status text check (status in ('new','contacted','verifying','onboarded','declined')) default 'new',
  created_at timestamptz default now()
);

-- ─── ADMIN ACTIVITY LOG ─────────────────────────────────────────────────────
-- Records who did what, when — especially for destructive/financial actions
-- (deleting a movie, hiding content, crediting funds). Not user-facing.
create table public.admin_activity_log (
  id uuid default uuid_generate_v4() primary key,
  admin_email text not null,
  action text not null,              -- e.g. 'movie.delete', 'movie.hide', 'legacy_fund.credit'
  target_type text,                  -- e.g. 'movie', 'sponsor', 'veteran_actor'
  target_label text,                 -- human-readable, e.g. the movie title
  details text,                      -- free text, e.g. amounts or reasons
  created_at timestamptz default now()
);
alter table public.admin_activity_log enable row level security;
-- No policies — only ever written/read via the service-role key in admin
-- API routes, same pattern as everything else locked down this way.

-- ─── MOVIE REELS (short highlight clips) ─────────────────────────────────────
-- Short cuts from a movie — a great scene, a memorable moment — separate
-- from the full film. Freely viewable without a subscription, since these
-- work as a discovery/marketing hook, same as a trailer would.
create table public.movie_reels (
  id uuid default uuid_generate_v4() primary key,
  movie_id uuid references public.movies(id) on delete cascade not null,
  title text not null,
  bunny_video_guid text,              -- set for paid, subscriber-only reels
  youtube_video_id text,              -- set for free public teasers (no Bunny cost)
  duration_seconds integer,
  view_count integer default 0,
  is_active boolean default false,
  created_at timestamptz default now()
);
alter table public.movie_reels enable row level security;
create policy "reels_read" on public.movie_reels
  for select using (is_active = true);
-- Writes only via service-role in admin routes, same pattern as everywhere else.

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Users can only read/write their own data.

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.watch_history enable row level security;
alter table public.watchlists enable row level security;
alter table public.watch_parties enable row level security;
alter table public.movies enable row level security;
-- ^ CRITICAL: the "movies_read" policy below was previously inert without
-- this line — RLS was never turned on for movies, meaning the public anon
-- key had full insert/update/delete access to the catalog with no policy
-- restricting it at all, not just open reads.

-- Lock down everything else that's only ever touched via the service-role
-- key in admin/API routes — no policies needed since service-role bypasses
-- RLS regardless, this just closes the anon key out entirely.
alter table public.movie_actors enable row level security;
alter table public.watch_party_members enable row level security;
alter table public.play_events enable row level security;
alter table public.royalty_distributions enable row level security;
alter table public.producers enable row level security;
alter table public.producer_submissions enable row level security;

-- Users: own row only
create policy "users_own" on public.users
  using (auth.uid() = id) with check (auth.uid() = id);

-- Profiles: owned by user
create policy "profiles_own" on public.profiles
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Movies: anyone authenticated can read active movies
create policy "movies_read" on public.movies
  for select using (is_active = true);

-- Watch history: profile owner only
create policy "history_own" on public.watch_history
  using (profile_id in (
    select id from public.profiles where user_id = auth.uid()
  ));

-- Watchlists: profile owner only
create policy "watchlist_own" on public.watchlists
  using (profile_id in (
    select id from public.profiles where user_id = auth.uid()
  ));

-- ─── FUNCTIONS & TRIGGERS ─────────────────────────────────────────────────────

-- Auto-create user row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  -- Auto-create a default profile named after the user
  insert into public.profiles (user_id, name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();

-- ─── INDEXES (performance) ────────────────────────────────────────────────────
create index on public.watch_history (profile_id);
create index on public.watch_history (movie_id);
create index on public.play_events (period, movie_id);
create index on public.movies (category, is_active);
create index on public.movies (is_featured);

-- ─── BUNNY.NET VIDEO GUID (replaces cloudflare_video_uid) ────────────────────
alter table public.movies add column if not exists bunny_video_guid text default null;
alter table public.movies add column if not exists youtube_trailer_id text default null;
-- Keep cloudflare_video_uid for backward compatibility during migration
