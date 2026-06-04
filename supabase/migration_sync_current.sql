-- AIABW · 数据库同步迁移（幂等，可重复执行）
-- 用途：将 Supabase 库结构对齐至当前最新代码要求
-- 适用：已执行过 schema.sql + 部分增量 migration 的现有项目
--
-- 在 Supabase Dashboard → SQL Editor 中整段执行本文件。
-- 执行前可选：先运行 supabase/scripts/verify_schema.sql 查看缺失项。
-- 执行后：再次运行 verify_schema.sql，应无 missing_* 结果（admin 账号除外）。

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

-- =========================
-- 1. payment_status 枚举：NOWPayments 回调使用 confirmed_finished
-- =========================
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'payment_status' and e.enumlabel = 'confirmed_finished'
  ) then
    alter type public.payment_status add value 'confirmed_finished';
  end if;
end $$;

-- =========================
-- 2. site_settings（MVP + 运营 + 访问统计）
-- =========================
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('site_name', 'AIABW · 艾比世界'),
  ('site_url', 'https://aiabw.com'),
  ('default_language', 'zh-CN'),
  ('payment_provider', 'NOWPayments'),
  ('ga4_id', 'G-11LB54EX3D'),
  ('total_page_views', '0'),
  ('last_page_view_at', ''),
  ('creator_share_rate', '0.70'),
  ('referral_commission_rate', '0.10'),
  ('trial_daily_limit', '3'),
  ('pro_monthly_price_usd', '19.9'),
  ('pro_yearly_price_usd', '149'),
  ('email_template_subscription_reminder', '您的 Pro 订阅即将到期，请及时续费。'),
  ('email_template_creator_new_agent', '您关注的创作者发布了新 Agent！'),
  ('email_template_inactive_recall', '好久不见，艾比世界有新 Agent 等你探索。')
on conflict (key) do nothing;

-- =========================
-- 3. transactions / user_agents（MVP 扩展）
-- =========================
alter table public.transactions
  add column if not exists order_type text not null default 'subscription',
  add column if not exists agent_id uuid references public.agents(id) on delete set null,
  add column if not exists referral_code text,
  add column if not exists inviter_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.user_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  purchased_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_id)
);

create index if not exists idx_user_agents_user_id on public.user_agents(user_id);
create index if not exists idx_user_agents_agent_id on public.user_agents(agent_id);
create index if not exists idx_transactions_order_type on public.transactions(order_type);
create unique index if not exists idx_subscriptions_user_id_unique on public.subscriptions(user_id);

alter table public.user_agents enable row level security;

do $$ begin
  create policy "users can read own user_agents" on public.user_agents
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can insert own user_agents" on public.user_agents
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- =========================
-- 4. Pro 订阅套餐（代码使用 pro_monthly / pro_yearly）
-- =========================
insert into public.subscription_plans (slug, name, description, interval, price_cents, currency, features, sort_order)
values
  ('pro_monthly', 'Pro 月度', 'AIABW Pro 月度会员 · 无限试用聊天', 'month', 1990, 'USD', '["无限试用聊天","优先响应","创建 Agent"]'::jsonb, 1),
  ('pro_yearly', 'Pro 年度', 'AIABW Pro 年度会员 · 省 40%+', 'year', 14900, 'USD', '["无限试用聊天","优先响应","创建 Agent","年度专属徽章"]'::jsonb, 2)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  interval = excluded.interval,
  price_cents = excluded.price_cents,
  features = excluded.features,
  sort_order = excluded.sort_order;

-- =========================
-- 5. Phase2：邀请 / 分账 / 缓存
-- =========================
create table if not exists public.invite_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_relationships (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid not null unique references auth.users(id) on delete cascade,
  invite_code text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.platform_cache (
  cache_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  binary_payload bytea,
  content_type text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.creator_wallets
  add column if not exists tron_payout_address text,
  add column if not exists tron_bound_at timestamptz;

-- =========================
-- 6. 邀请佣金钱包
-- =========================
create table if not exists public.referral_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_usd numeric(12,2) not null default 0,
  pending_usd numeric(12,2) not null default 0,
  total_earned_usd numeric(12,2) not null default 0,
  total_withdrawn_usd numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_withdrawals (
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

-- =========================
-- 7. 社交 / 邮件 / LLM 统计
-- =========================
create table if not exists public.creator_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, creator_user_id),
  constraint creator_follows_not_self check (follower_user_id <> creator_user_id)
);

create table if not exists public.email_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  reference_key text not null,
  email_to text not null,
  subject text not null,
  status text not null default 'sent',
  provider text not null default 'resend',
  provider_id text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (user_id, notification_type, reference_key)
);

alter table public.trial_logs
  add column if not exists llm_tier text,
  add column if not exists model text,
  add column if not exists cost_usd numeric(12, 6),
  add column if not exists latency_ms integer;

create table if not exists public.llm_user_daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (current_date at time zone 'utc'),
  call_count integer not null default 0,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- =========================
-- 8. Admin 运营：Agent 审核 / 审计日志
-- =========================
alter table public.agents
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_note text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sales_count integer not null default 0;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

update public.agents set moderation_status = 'pending'
where status = 'draft' and moderation_status = 'approved';

update public.agents a
set sales_count = coalesce((
  select count(*)::int from public.user_agents ua where ua.agent_id = a.id
), 0)
where sales_count = 0;

-- 新购 Agent 时自动累加 sales_count
create or replace function public.bump_agent_sales_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.agents set sales_count = sales_count + 1 where id = new.agent_id;
  return new;
end;
$$;

drop trigger if exists trg_user_agents_bump_sales on public.user_agents;
create trigger trg_user_agents_bump_sales
  after insert on public.user_agents
  for each row execute function public.bump_agent_sales_count();

-- =========================
-- 9. 新用户自动创建 profiles
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'user',
    'zh-CN'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (user_id, display_name, role, language)
select
  u.id,
  split_part(coalesce(u.email, 'user'), '@', 1),
  'user',
  'zh-CN'
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id)
on conflict (user_id) do nothing;

-- =========================
-- 10. RPC：Explore 搜索 / 邮件 Cron
-- =========================
create or replace function public.search_public_agents(
  p_q text default '',
  p_tags text[] default array[]::text[],
  p_category_slug text default null,
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  slug text,
  name text,
  description text,
  metadata jsonb,
  category_name text,
  category_slug text,
  rank real
)
language sql stable set search_path = public
as $$
  with tag_list as (
    select distinct lower(trim(t)) as tag
    from unnest(coalesce(p_tags, array[]::text[])) as u(t)
    where trim(t) <> ''
  ),
  scoped as (
    select a.id, a.slug, a.name, a.description, a.metadata,
           c.name as category_name, c.slug as category_slug, a.created_at
    from public.agents a
    left join public.categories c on c.id = a.category_id
    where a.status = 'active' and a.visibility = 'public'
      and (p_category_slug is null or c.slug = p_category_slug)
      and (
        not exists (select 1 from tag_list)
        or exists (
          select 1 from public.agent_tags at
          inner join tag_list tl on lower(at.tag) = tl.tag
          where at.agent_id = a.id
        )
      )
  ),
  scored as (
    select s.*,
      case when coalesce(nullif(trim(p_q), ''), '') = '' or char_length(trim(p_q)) < 2 then 0::real
      else greatest(
        similarity(s.name, trim(p_q)), similarity(s.description, trim(p_q)),
        word_similarity(trim(p_q), s.name), word_similarity(trim(p_q), s.description)
      ) end as sim
    from scoped s
  ),
  filtered as (
    select * from scored
    where coalesce(nullif(trim(p_q), ''), '') = '' or char_length(trim(p_q)) < 2
       or sim >= 0.12 or name ilike '%' || trim(p_q) || '%'
       or description ilike '%' || trim(p_q) || '%' or slug ilike '%' || trim(p_q) || '%'
  )
  select f.slug, f.name, f.description, f.metadata, f.category_name, f.category_slug, f.sim as rank
  from filtered f
  order by f.sim desc, f.created_at desc
  limit greatest(1, least(p_limit, 48))
  offset greatest(0, p_offset);
$$;

create or replace function public.list_subscriptions_expiring_on_day(p_days_from_now integer default 3)
returns table (user_id uuid, email text, period_end timestamptz, plan_id uuid)
language sql security definer stable set search_path = public, auth
as $$
  select s.user_id, u.email, s.current_period_end, s.plan_id
  from public.subscriptions s
  inner join auth.users u on u.id = s.user_id
  where s.status = 'active' and s.current_period_end is not null and u.email is not null
    and s.current_period_end >= (current_date + p_days_from_now)::timestamptz
    and s.current_period_end < (current_date + p_days_from_now + 1)::timestamptz;
$$;

create or replace function public.list_inactive_recall_users(p_days integer default 7)
returns table (user_id uuid, email text, last_sign_in_at timestamptz)
language sql security definer stable set search_path = public, auth
as $$
  select u.id, u.email, u.last_sign_in_at
  from auth.users u
  where u.email is not null and u.last_sign_in_at is not null
    and u.last_sign_in_at < now() - (p_days || ' days')::interval
    and u.last_sign_in_at >= now() - ((p_days + 1) || ' days')::interval;
$$;

grant execute on function public.search_public_agents to service_role;
grant execute on function public.list_subscriptions_expiring_on_day(integer) to service_role;
grant execute on function public.list_inactive_recall_users(integer) to service_role;

-- =========================
-- 11. 性能索引（幂等）
-- =========================
create index if not exists idx_agents_moderation_status on public.agents(moderation_status, created_at desc);
create index if not exists idx_agents_is_featured on public.agents(is_featured) where is_featured = true;
create index if not exists idx_agents_sales_count on public.agents(sales_count desc);
create index if not exists idx_admin_audit_log_created on public.admin_audit_log(created_at desc);
create index if not exists idx_transactions_user_created on public.transactions(user_id, created_at desc);
create index if not exists idx_user_agents_user_purchased on public.user_agents(user_id, purchased_at desc);
create index if not exists idx_agents_name_trgm on public.agents using gin (name gin_trgm_ops);
create index if not exists idx_agents_description_trgm on public.agents using gin (description gin_trgm_ops);
create index if not exists idx_creator_earnings_weekly_settled on public.creator_earnings (created_at desc, creator_user_id) where status = 'settled';
create index if not exists idx_creator_follows_creator on public.creator_follows(creator_user_id, created_at desc);
create index if not exists idx_llm_user_daily_stats_day on public.llm_user_daily_stats(day desc, cost_usd desc);
create index if not exists idx_trial_logs_user_created on public.trial_logs(user_id, created_at desc);
