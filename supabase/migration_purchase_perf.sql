-- Purchase & listing performance indexes (AIABW monetization)

create index if not exists idx_transactions_user_created
  on public.transactions(user_id, created_at desc);

create index if not exists idx_transactions_agent_pending
  on public.transactions(user_id, agent_id, payment_status)
  where order_type = 'agent' and agent_id is not null;

create index if not exists idx_user_agents_user_purchased
  on public.user_agents(user_id, purchased_at desc);

create index if not exists idx_agents_slug_active
  on public.agents(slug)
  where status = 'active' and visibility = 'public';
