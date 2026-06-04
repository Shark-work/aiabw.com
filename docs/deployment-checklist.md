# AIABW 正式上线配置表

## Vercel
- `NEXT_PUBLIC_APP_URL=https://aiabw.com`
- `NEXT_PUBLIC_SUPABASE_URL=<your supabase url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<your service role key>`
- `NOWPAYMENTS_API_KEY=<your nowpayments api key>`
- `NOWPAYMENTS_PUBLIC_KEY=<your nowpayments public key>`
- `NOWPAYMENTS_IPN_SECRET=<your nowpayments ipn secret>`
- `NOWPAYMENTS_PAYOUT_EMAIL=<dashboard login email for payout JWT>`
- `NOWPAYMENTS_PAYOUT_PASSWORD=<dashboard password for payout JWT>`
- `DEEPSEEK_API_KEY=<required for free-tier Agent chat>`
- `DEEPSEEK_BASE_URL=https://api.deepseek.com/v1` (optional)
- `DEEPSEEK_MODEL=deepseek-chat` (optional, free tier)
- `QWEN_API_KEY=<required for Pro chat + content moderation>`
- `QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (optional)
- `QWEN_MODEL=qwen3.6-plus` (optional, Pro tier)
- `LLM_FREE_DAILY_CALL_CAP=3` (optional)
- `LLM_PRO_DAILY_CALL_CAP=500` (optional)
- `LLM_FREE_DAILY_COST_CAP_USD=0.08` (optional)
- `LLM_PRO_DAILY_COST_CAP_USD=5` (optional)
- `CRON_SECRET=<random secret for /api/cron/* endpoints>`
- `RESEND_API_KEY=<Resend.com API key for transactional email>`
- `EMAIL_FROM=AIABW <noreply@aiabw.com>` (verified domain in Resend)

## Supabase Auth
- Site URL: `https://aiabw.com`
- Redirect URLs:
  - `https://aiabw.com`
  - `https://aiabw.com/account`
  - `https://aiabw.com/auth/login`

## Supabase Database
- Run migrations then seed (SQL Editor, in order):
  1. `supabase/schema.sql`
  2. `supabase/migration_mvp.sql`
  3. `supabase/migration_phase2.sql`
  4. `supabase/migration_purchase_perf.sql` (if present)
  5. `supabase/seed.sql` — **20 个 Agent**（5 垂类 × 4）
  6. `supabase/seed_tags.sql`
  7. `supabase/migration_site_analytics.sql` — 全站访问量计数
  8. `supabase/migration_referral_wallet.sql` — 邀请佣金钱包与提现
  9. `supabase/migration_creator_tron_wallet.sql` — 创作者 TRON 提现地址绑定
  10. `supabase/migration_explore_search.sql` — Explore pg_trgm 搜索 RPC + 索引
  11. `supabase/seed_explore_tags.sql` — Explore 标签同义词（可选，在 seed_tags 后）
  12. `supabase/migration_leaderboard_perf.sql` — 周销量榜 creator_earnings 索引
  13. `supabase/migration_social.sql` — 关注创作者 + 收藏索引
  14. `supabase/migration_email_notifications.sql` — 邮件通知去重 + 召回 RPC
  15. `supabase/migration_llm_usage.sql` — LLM 成本统计与日级防刷
- Seed categories: `companion` 虚拟伴侣 · `story-universe` 故事宇宙 · `adventure` 冒险世界 · `meme` Meme 整活 · `game` 游戏乐园
- `profiles` has an `admin` role row for your user id
- `site_settings` table exists and stores:
  - `site_name`
  - `site_url`
  - `default_language`
  - `payment_provider`
  - `ga4_id`
- `subscription_plans` exists and is seeded with `explorer`, `creator`, `universe`
- `transactions.order_id` is unique
- `profiles.user_id` is unique

## Cron (Vercel)
- `CRON_SECRET` must match `Authorization: Bearer <CRON_SECRET>` on cron routes
- `/api/cron/recompute` — every 10 min (revenue, leaderboard cache)
- `/api/cron/emails` — daily 09:00 UTC (订阅到期提醒、7日召回、创作者新 Agent 补发)

## Email (Resend)
- Verify sending domain in [Resend](https://resend.com)
- Dev without `RESEND_API_KEY`: emails log to console only
- Opt-out via `profiles.metadata.email_notifications`: `{ "subscription": false, "creator": false, "recall": false }`

## NOWPayments
- Webhook URL: `https://aiabw.com/api/nowpayments/webhook`
- IPN secret matches production env variable
- API key is production-ready

## Smoke Test Before Public Launch
1. Login at `/auth/login`
2. Open `/admin`
3. Edit and save `/admin/settings`
4. Open `/pro`
5. Create an order in `/checkout`
6. Confirm webhook updates `transactions`
7. Confirm `/account` reflects subscription state
