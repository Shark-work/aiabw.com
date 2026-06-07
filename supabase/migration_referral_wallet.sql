-- Referral inviter wallet & withdrawals (10% commission)

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

create index if not exists idx_referral_withdrawals_user on public.referral_withdrawals(user_id, created_at desc);
create index if not exists idx_referral_commissions_inviter_created on public.referral_commissions(inviter_user_id, created_at desc);

alter table public.referral_wallets enable row level security;
alter table public.referral_withdrawals enable row level security;

create policy "users read own referral wallet" on public.referral_wallets
  for select using (auth.uid() = user_id);

create policy "users read own referral withdrawals" on public.referral_withdrawals
  for select using (auth.uid() = user_id);
