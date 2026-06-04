-- LLM 调用成本统计 + 日级防刷
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

create index if not exists idx_llm_user_daily_stats_day on public.llm_user_daily_stats(day desc, cost_usd desc);
create index if not exists idx_trial_logs_user_created on public.trial_logs(user_id, created_at desc);

alter table public.llm_user_daily_stats enable row level security;

create policy "users read own llm stats"
  on public.llm_user_daily_stats for select
  using (auth.uid() = user_id);
