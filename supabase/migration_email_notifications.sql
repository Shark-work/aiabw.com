-- 邮件通知去重日志 + 召回/到期查询辅助
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

create index if not exists idx_email_notification_log_user on public.email_notification_log(user_id, created_at desc);
create index if not exists idx_email_notification_log_type on public.email_notification_log(notification_type, created_at desc);

alter table public.email_notification_log enable row level security;

-- 仅 service role 通过 admin client 访问，无公开 policy

create or replace function public.list_subscriptions_expiring_on_day(p_days_from_now integer default 3)
returns table (
  user_id uuid,
  email text,
  period_end timestamptz,
  plan_id uuid
)
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    s.user_id,
    u.email,
    s.current_period_end,
    s.plan_id
  from public.subscriptions s
  inner join auth.users u on u.id = s.user_id
  where s.status = 'active'
    and s.current_period_end is not null
    and u.email is not null
    and s.current_period_end >= (current_date + p_days_from_now)::timestamptz
    and s.current_period_end < (current_date + p_days_from_now + 1)::timestamptz;
$$;

create or replace function public.list_inactive_recall_users(p_days integer default 7)
returns table (
  user_id uuid,
  email text,
  last_sign_in_at timestamptz
)
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email,
    u.last_sign_in_at
  from auth.users u
  where u.email is not null
    and u.last_sign_in_at is not null
    and u.last_sign_in_at < now() - (p_days || ' days')::interval
    and u.last_sign_in_at >= now() - ((p_days + 1) || ' days')::interval;
$$;

grant execute on function public.list_subscriptions_expiring_on_day(integer) to service_role;
grant execute on function public.list_inactive_recall_users(integer) to service_role;
