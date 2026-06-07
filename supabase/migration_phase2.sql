-- Phase 2: referral, creator revenue, cache, search indexes

create extension if not exists pg_trgm;

-- =========================
-- INVITE / REFERRAL
-- =========================
create table if not exists public.invite_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_invite_codes_code on public.invite_codes(code);

create table if not exists public.invite_relationships (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid not null unique references auth.users(id) on delete cascade,
  invite_code text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_invite_relationships_inviter on public.invite_relationships(inviter_user_id);

alter table public.transactions
  add column if not exists referral_code text,
  add column if not exists inviter_user_id uuid references auth.users(id) on delete set null;

-- =========================
-- REVENUE LEDGER (async processed)
-- =========================
create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  event_type text not null,
  gross_usd numeric(12,2) not null default 0,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  creator_user_id uuid references auth.users(id) on delete set null,
  inviter_user_id uuid references auth.users(id) on delete set null,
  referral_code text,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_revenue_events_processed on public.revenue_events(processed, created_at);

create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  gross_usd numeric(12,2) not null,
  commission_usd numeric(12,2) not null,
  commission_rate numeric(5,4) not null default 0.1000,
  status text not null default 'settled',
  created_at timestamptz not null default now()
);
create index if not exists idx_referral_commissions_inviter on public.referral_commissions(inviter_user_id);

create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  gross_usd numeric(12,2) not null,
  creator_usd numeric(12,2) not null,
  platform_usd numeric(12,2) not null,
  creator_rate numeric(5,4) not null default 0.7000,
  status text not null default 'settled',
  created_at timestamptz not null default now()
);
create index if not exists idx_creator_earnings_creator on public.creator_earnings(creator_user_id, created_at desc);
create index if not exists idx_creator_earnings_agent_week on public.creator_earnings(agent_id, created_at desc);

create table if not exists public.creator_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_usd numeric(12,2) not null default 0,
  pending_usd numeric(12,2) not null default 0,
  total_earned_usd numeric(12,2) not null default 0,
  total_withdrawn_usd numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_usd numeric(12,2) not null,
  pay_currency text not null default 'usdttrc20',
  payout_address text not null,
  status text not null default 'pending',
  provider text not null default 'nowpayments',
  provider_payout_id text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_creator_withdrawals_user on public.creator_withdrawals(user_id, created_at desc);

-- =========================
-- PLATFORM CACHE (leaderboard, search, share cards, stats)
-- =========================
create table if not exists public.platform_cache (
  cache_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  binary_payload bytea,
  content_type text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists idx_platform_cache_expires on public.platform_cache(expires_at);

-- =========================
-- SEARCH INDEXES
-- =========================
create index if not exists idx_agents_public_list on public.agents(status, visibility, created_at desc);
create index if not exists idx_agents_name_trgm on public.agents using gin (name gin_trgm_ops);
create index if not exists idx_agents_description_trgm on public.agents using gin (description gin_trgm_ops);
create index if not exists idx_agent_tags_tag_agent on public.agent_tags(tag, agent_id);

-- =========================
-- RLS
-- =========================
alter table public.invite_codes enable row level security;
alter table public.invite_relationships enable row level security;
alter table public.referral_commissions enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.creator_wallets enable row level security;
alter table public.creator_withdrawals enable row level security;
alter table public.platform_cache enable row level security;

create policy "invite codes readable" on public.invite_codes for select using (true);
create policy "users read own invite code" on public.invite_codes for select using (auth.uid() = user_id);

create policy "users read own referrals" on public.invite_relationships for select using (auth.uid() = inviter_user_id or auth.uid() = invitee_user_id);

create policy "users read own referral commissions" on public.referral_commissions for select using (auth.uid() = inviter_user_id);

create policy "creators read own earnings" on public.creator_earnings for select using (auth.uid() = creator_user_id);

create policy "creators read own wallet" on public.creator_wallets for select using (auth.uid() = user_id);

create policy "creators read own withdrawals" on public.creator_withdrawals for select using (auth.uid() = user_id);
create policy "creators insert own withdrawals" on public.creator_withdrawals for insert with check (auth.uid() = user_id);
