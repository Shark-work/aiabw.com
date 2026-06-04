-- 社交：关注创作者（收藏 agent_favorites 已在 schema.sql）
create table if not exists public.creator_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, creator_user_id),
  constraint creator_follows_not_self check (follower_user_id <> creator_user_id)
);

create index if not exists idx_creator_follows_creator on public.creator_follows(creator_user_id, created_at desc);
create index if not exists idx_creator_follows_follower on public.creator_follows(follower_user_id, created_at desc);
create index if not exists idx_agent_favorites_user on public.agent_favorites(user_id, created_at desc);
create index if not exists idx_agent_favorites_agent on public.agent_favorites(agent_id);

alter table public.creator_follows enable row level security;

create policy "users read own follows"
  on public.creator_follows for select
  using (auth.uid() = follower_user_id or auth.uid() = creator_user_id);

create policy "users manage own follows"
  on public.creator_follows for all
  using (auth.uid() = follower_user_id)
  with check (auth.uid() = follower_user_id);
