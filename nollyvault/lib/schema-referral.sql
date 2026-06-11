-- ═══════════════════════════════════════════════════════════════════════════
-- NaijaRewind — Actor Referral System
-- Run in Supabase SQL Editor after main schemas
-- ═══════════════════════════════════════════════════════════════════════════

-- Referral codes per veteran actor
create table if not exists public.actor_referral_codes (
  id uuid default uuid_generate_v4() primary key,
  veteran_actor_id uuid references public.veteran_actors(id) on delete cascade,
  actor_name text not null,
  code text unique not null,           -- e.g. 'KANAYO2024', 'PETE50'
  is_active boolean default true,
  total_referrals integer default 0,
  total_earned_ngn numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- Track which subscriber was referred by which actor
create table if not exists public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referral_code text references public.actor_referral_codes(code),
  veteran_actor_id uuid references public.veteran_actors(id),
  actor_name text,
  referred_user_id uuid references public.users(id) on delete cascade,
  referred_at timestamptz default now(),
  is_active boolean default true,      -- false when subscriber cancels
  unique(referred_user_id)             -- one referral per user
);

-- Monthly referral earnings ledger
create table if not exists public.referral_earnings (
  id uuid default uuid_generate_v4() primary key,
  period text not null,                -- '2024-06'
  veteran_actor_id uuid references public.veteran_actors(id),
  actor_name text,
  referral_code text,
  active_referrals integer default 0,
  revenue_from_referrals_ngn numeric(12,2) default 0,
  pct numeric(5,2) default 5.00,       -- 5% referral cut
  earned_ngn numeric(12,2) default 0,
  status text check (status in ('calculated','paid')) default 'calculated',
  created_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists on public.referrals (referral_code);
create index if not exists on public.referrals (veteran_actor_id);
create index if not exists on public.referral_earnings (period, veteran_actor_id);

-- Add referral_code column to users table (captured at signup)
alter table public.users add column if not exists referred_by_code text default null;
alter table public.users add column if not exists referred_by_actor_id uuid default null;

-- Add watch limit to users (for Classic plan enforcement)
alter table public.users add column if not exists monthly_watch_minutes integer default 0;
alter table public.users add column if not exists watch_limit_reset_at timestamptz default now();
