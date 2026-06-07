-- Admin operations: agent moderation, featured flag, sales cache, audit log

alter table public.agents
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_note text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sales_count integer not null default 0;

create index if not exists idx_agents_moderation_status on public.agents(moderation_status, created_at desc);
create index if not exists idx_agents_is_featured on public.agents(is_featured) where is_featured = true;
create index if not exists idx_agents_sales_count on public.agents(sales_count desc);

-- Backfill: draft = pending, active = approved
update public.agents set moderation_status = 'pending' where status = 'draft' and moderation_status = 'approved';
update public.agents set moderation_status = 'rejected' where status = 'archived' and metadata->>'moderation_rejected' = 'true';

-- Sales count from purchases
update public.agents a
set sales_count = coalesce((
  select count(*)::int from public.user_agents ua where ua.agent_id = a.id
), 0);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;

-- Admin audit: service role only (no public policies)

insert into public.site_settings (key, value) values
  ('creator_share_rate', '0.70'),
  ('referral_commission_rate', '0.10'),
  ('trial_daily_limit', '3'),
  ('pro_monthly_price_usd', '19.9'),
  ('pro_yearly_price_usd', '149'),
  ('email_template_subscription_reminder', '您的 Pro 订阅即将到期，请及时续费。'),
  ('email_template_creator_new_agent', '您关注的创作者发布了新 Agent！'),
  ('email_template_inactive_recall', '好久不见，艾比世界有新 Agent 等你探索。')
on conflict (key) do nothing;
