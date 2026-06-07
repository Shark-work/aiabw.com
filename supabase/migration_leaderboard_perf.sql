-- 周销量榜聚合加速
create index if not exists idx_creator_earnings_weekly_settled
  on public.creator_earnings (created_at desc, creator_user_id)
  where status = 'settled';
