-- PlayAgent Sphere Supabase Schema
-- Core tables for agents, profiles, subscriptions, trials, and monetization.

create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================
do $$ begin create type public.agent_status as enum ('draft', 'active', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.agent_visibility as enum ('public', 'private', 'unlisted'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_role as enum ('user', 'creator', 'moderator', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete'); exception when duplicate_object then null; end $$;
do $$ begin create type public.billing_interval as enum ('month', 'year'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending', 'confirming', 'confirmed', 'finished', 'failed', 'refunded', 'expired'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  role public.user_role not null default 'user',
  language text not null default 'zh-CN',
  location text,
  is_creator boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- CATEGORIES / AGENTS
-- =========================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  prompt text,
  system_prompt text,
  avatar_url text,
  cover_url text,
  demo_url text,
  model text,
  temperature numeric(3,2) not null default 0.70,
  status public.agent_status not null default 'draft',
  visibility public.agent_visibility not null default 'public',
  category_id uuid references public.categories(id) on delete set null,
  created_by uuid references public.profiles(user_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_agents_category_id on public.agents(category_id);
create index if not exists idx_agents_created_by on public.agents(created_by);
create index if not exists idx_agents_status on public.agents(status);
create index if not exists idx_agents_visibility on public.agents(visibility);

create table if not exists public.agent_tags (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (agent_id, tag)
);

create table if not exists public.agent_likes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, user_id)
);

create table if not exists public.agent_favorites (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, user_id)
);

create table if not exists public.agent_comments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- SUBSCRIPTIONS / PAYMENTS
-- =========================
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  interval public.billing_interval not null,
  price_cents integer not null default 0,
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status public.subscription_status not null default 'incomplete',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_slug text not null,
  provider text not null default 'nowpayments',
  provider_payment_id text,
  payment_status public.payment_status not null default 'pending',
  price_amount numeric(12,2) not null default 0,
  price_currency text not null default 'USD',
  pay_amount text,
  pay_currency text,
  invoice_url text,
  order_id text not null unique,
  order_description text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_payment_status on public.transactions(payment_status);
create index if not exists idx_transactions_provider_payment_id on public.transactions(provider_payment_id);

create table if not exists public.trial_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trial_type text not null default 'chat',
  used_count integer not null default 0,
  limit_count integer not null default 10,
  reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trial_type)
);

create table if not exists public.trial_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  provider text,
  prompt_tokens integer,
  completion_tokens integer,
  status text not null default 'ok',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- TRIGGERS
-- =========================
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger set_agents_updated_at before update on public.agents for each row execute function public.set_updated_at();
create trigger set_agent_comments_updated_at before update on public.agent_comments for each row execute function public.set_updated_at();
create trigger set_subscription_plans_updated_at before update on public.subscription_plans for each row execute function public.set_updated_at();
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger set_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger set_trial_quotas_updated_at before update on public.trial_quotas for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.agents enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.trial_quotas enable row level security;
alter table public.trial_logs enable row level security;
alter table public.agent_tags enable row level security;
alter table public.agent_likes enable row level security;
alter table public.agent_favorites enable row level security;
alter table public.agent_comments enable row level security;

create policy "profiles are readable" on public.profiles for select using (true);
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories are readable" on public.categories for select using (true);
create policy "subscription plans are readable" on public.subscription_plans for select using (true);

create policy "users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "users can insert own subscription" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "users can update own subscription" on public.subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "users can update own transactions" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own trial quota" on public.trial_quotas for select using (auth.uid() = user_id);
create policy "users can insert own trial quota" on public.trial_quotas for insert with check (auth.uid() = user_id);
create policy "users can update own trial quota" on public.trial_quotas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can read own trial logs" on public.trial_logs for select using (auth.uid() = user_id);

create policy "public can read active public agents" on public.agents for select using (status = 'active' and visibility = 'public');
create policy "authenticated users can create agents" on public.agents for insert with check (auth.uid() is not null and auth.uid() = created_by);
create policy "owners can update their agents" on public.agents for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "owners can delete their agents" on public.agents for delete using (auth.uid() = created_by);

create policy "public can read tags for public agents" on public.agent_tags for select using (exists (select 1 from public.agents a where a.id = agent_tags.agent_id and a.status = 'active' and a.visibility = 'public'));
create policy "owners can manage tags" on public.agent_tags for all using (exists (select 1 from public.agents a where a.id = agent_tags.agent_id and a.created_by = auth.uid())) with check (exists (select 1 from public.agents a where a.id = agent_tags.agent_id and a.created_by = auth.uid()));

create policy "likes are self-managed" on public.agent_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorites are self-managed" on public.agent_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments readable on public agents" on public.agent_comments for select using (exists (select 1 from public.agents a where a.id = agent_comments.agent_id and a.status = 'active' and a.visibility = 'public'));
create policy "users can create comments" on public.agent_comments for insert with check (auth.uid() = user_id);
create policy "users can edit own comments" on public.agent_comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own comments" on public.agent_comments for delete using (auth.uid() = user_id);
