-- 创作者绑定 TRON (TRC20) 提现地址
alter table public.creator_wallets
  add column if not exists tron_payout_address text,
  add column if not exists tron_bound_at timestamptz;

create index if not exists idx_creator_wallets_tron on public.creator_wallets(tron_payout_address)
  where tron_payout_address is not null;

comment on column public.creator_wallets.tron_payout_address is 'USDT TRC20 收款地址 (TRON)';
comment on column public.creator_wallets.tron_bound_at is 'TRON 地址绑定时间';
