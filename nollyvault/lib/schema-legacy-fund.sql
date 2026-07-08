-- ═══════════════════════════════════════════════════════════════════════════
-- NaijaRewind Legacy Fund Schema
-- Run in Supabase SQL Editor after main schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── VETERAN ACTORS REGISTRY ─────────────────────────────────────────────────
create table public.veteran_actors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  bio text,
  profile_image_url text,
  birth_year integer,
  state_of_origin text,
  career_start_year integer,
  career_highlights text[],       -- array of notable achievements
  is_verified boolean default false,  -- verified contact / bank details
  bank_name text,
  account_number text,             -- only filled when direct payments begin
  account_name text,
  status text check (status in ('active','deceased','uncontacted')) default 'uncontacted',
  created_at timestamptz default now()
);

-- ─── ACTOR → MOVIE POINTS (Legacy Points System) ─────────────────────────────
create table public.movie_legacy_points (
  id uuid default uuid_generate_v4() primary key,
  movie_id uuid references public.movies(id) on delete cascade,
  actor_name text not null,           -- matches veteran_actors.name where possible
  veteran_actor_id uuid references public.veteran_actors(id),  -- null until linked
  role_type text check (role_type in ('lead','major_supporting','minor_supporting')) default 'minor_supporting',
  legacy_points integer default 1,    -- lead=5, major_supporting=3, minor=1
  created_at timestamptz default now(),
  unique(movie_id, actor_name)
);

-- Auto-assign points based on role_type
create or replace function public.set_legacy_points()
returns trigger language plpgsql as $$
begin
  new.legacy_points := case new.role_type
    when 'lead' then 5
    when 'major_supporting' then 3
    else 1
  end;
  return new;
end;
$$;

create trigger legacy_points_auto
  before insert or update on public.movie_legacy_points
  for each row execute procedure public.set_legacy_points();

-- ─── LEGACY FUND LEDGER ───────────────────────────────────────────────────────
-- Tracks every naira that enters and leaves the fund
create table public.legacy_fund_ledger (
  id uuid default uuid_generate_v4() primary key,
  period text not null,             -- '2024-06'
  entry_type text check (entry_type in ('credit','debit')) not null,
  amount_ngn numeric(14,2) not null,
  description text,
  -- Credit fields
  total_platform_revenue_ngn numeric(14,2),
  fund_pct numeric(5,2) default 10.00,
  -- Debit fields (when paying out)
  beneficiary_type text check (beneficiary_type in ('actor_direct','foundation','emergency','medical','housing','scholarship')),
  veteran_actor_id uuid references public.veteran_actors(id),
  created_at timestamptz default now()
);

-- Running balance view
create or replace view public.legacy_fund_balance as
select
  coalesce(sum(case when entry_type = 'credit' then amount_ngn else 0 end), 0) as total_credited,
  coalesce(sum(case when entry_type = 'debit' then amount_ngn else 0 end), 0) as total_disbursed,
  coalesce(sum(case when entry_type = 'credit' then amount_ngn else -amount_ngn end), 0) as current_balance,
  count(*) filter (where entry_type = 'credit') as months_active
from public.legacy_fund_ledger;

-- ─── MONTHLY ACTOR ALLOCATIONS ───────────────────────────────────────────────
-- Calculated but NOT paid until actor is verified and agreements signed
create table public.actor_legacy_allocations (
  id uuid default uuid_generate_v4() primary key,
  period text not null,
  actor_name text not null,
  veteran_actor_id uuid references public.veteran_actors(id),
  total_points integer default 0,
  watch_minutes integer default 0,
  pool_share_pct numeric(7,4),
  calculated_amount_ngn numeric(12,2),
  status text check (status in ('calculated','approved','paid','held')) default 'calculated',
  -- 'held' = calculated but actor not yet onboarded; accumulates for future payment
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── IMPACT STATS (for public homepage display) ───────────────────────────────
create table public.impact_stats (
  id uuid default uuid_generate_v4() primary key,
  period text not null unique,
  total_revenue_ngn numeric(14,2),
  fund_contribution_ngn numeric(14,2),
  total_disbursed_ngn numeric(14,2),
  actors_benefited integer default 0,
  watch_hours_total integer default 0,
  subscriber_count integer default 0,
  updated_at timestamptz default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index on public.movie_legacy_points (movie_id);
create index on public.movie_legacy_points (veteran_actor_id);
create index on public.actor_legacy_allocations (period, status);
create index on public.legacy_fund_ledger (period);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEGACY FUND v2 — Refinements
-- Run after initial schema-legacy-fund.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Custom points override per actor per movie (admin-adjustable)
alter table public.movie_legacy_points
  add column if not exists custom_points_override integer default null;

-- Update the trigger to respect custom override
create or replace function public.set_legacy_points()
returns trigger language plpgsql as $$
begin
  -- If admin has set a custom override, use it; otherwise use role defaults
  if new.custom_points_override is not null then
    new.legacy_points := new.custom_points_override;
  else
    new.legacy_points := case new.role_type
      when 'lead' then 5
      when 'major_supporting' then 3
      else 1
    end;
  end if;
  return new;
end;
$$;

-- 2. Pool type on ledger entries (participation | assistance | preservation)
alter table public.legacy_fund_ledger
  add column if not exists pool_type text
    check (pool_type in ('participation','assistance','preservation','combined'))
    default 'combined';

-- 3. Sub-pool split tracking on allocations
alter table public.actor_legacy_allocations
  add column if not exists pool_type text
    check (pool_type in ('participation','assistance'))
    default 'participation';

-- 4. Governance board table (structure exists even if seats are vacant at launch)
create table if not exists public.governance_board (
  id uuid default uuid_generate_v4() primary key,
  seat text not null,         -- 'veteran_actor', 'producer', 'independent', 'naijaRewind'
  seat_label text not null,   -- display name for the seat
  holder_name text,           -- null = vacant
  holder_bio text,
  holder_image_url text,
  appointed_at timestamptz,
  is_vacant boolean default true,
  created_at timestamptz default now()
);

-- Seed the four governance seats (vacant at launch)
insert into public.governance_board (seat, seat_label, is_vacant) values
  ('veteran_actor',  'Veteran Actor Representative',    true),
  ('producer',       'Producer Representative',         true),
  ('independent',    'Independent Cultural Advisor',    true),
  ('naijaRewind',     'NaijaRewind Leadership',           false)
on conflict do nothing;

-- 5. Public legacy fund stats view (safe to expose via API)
create or replace view public.legacy_fund_public_stats as
select
  (select coalesce(sum(amount_ngn),0) from public.legacy_fund_ledger where entry_type='credit') as total_allocated_ngn,
  (select coalesce(sum(amount_ngn),0) from public.legacy_fund_ledger where entry_type='debit') as total_disbursed_ngn,
  (select coalesce(sum(amount_ngn),0) from public.legacy_fund_ledger where entry_type='credit' and pool_type='preservation') as preservation_allocated_ngn,
  (select coalesce(sum(amount_ngn),0) from public.legacy_fund_ledger where entry_type='credit' and pool_type='assistance') as assistance_allocated_ngn,
  (select count(*) from public.veteran_actors where is_verified=true) as verified_actors,
  (select count(*) from public.veteran_actors) as registered_actors,
  (select count(*) from public.movies where is_active=true) as active_films;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Veteran actor personal/payout info and fund ledgers are only ever queried
-- via the service-role key in pages/api/admin/legacy-fund/*. The /veterans
-- page fetches its public stats through /api/admin/legacy-fund/stats (server
-- route), not a direct client query, so locking these fully doesn't break
-- anything currently displayed.
alter table public.veteran_actors enable row level security;
alter table public.movie_legacy_points enable row level security;
alter table public.legacy_fund_ledger enable row level security;
alter table public.actor_legacy_allocations enable row level security;
alter table public.impact_stats enable row level security;
alter table public.governance_board enable row level security;
