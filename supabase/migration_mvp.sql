-- MVP migration: user_agents, site_settings, transaction extensions, subscription unique

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists order_type text not null default 'subscription';

alter table public.transactions
  add column if not exists agent_id uuid references public.agents(id) on delete set null;

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

create policy "users can read own user_agents" on public.user_agents
  for select using (auth.uid() = user_id);

create policy "users can insert own user_agents" on public.user_agents
  for insert with check (auth.uid() = user_id);

create trigger set_user_agents_updated_at before update on public.user_agents
  for each row execute function public.set_updated_at();

-- Pro subscription plans
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

insert into public.site_settings (key, value) values
  ('site_name', 'AIABW · 艾比世界'),
  ('site_url', 'https://aiabw.com'),
  ('default_language', 'zh-CN'),
  ('payment_provider', 'NOWPayments'),
  ('ga4_id', 'G-11LB54EX3D')
on conflict (key) do nothing;
