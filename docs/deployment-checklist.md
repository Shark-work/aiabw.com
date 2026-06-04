# AIABW 正式上线配置表

## Vercel
- `NEXT_PUBLIC_APP_URL=https://aiabw.com`
- `NEXT_PUBLIC_SUPABASE_URL=<your supabase url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<your service role key>`
- `NOWPAYMENTS_API_KEY=<your nowpayments api key>`
- `NOWPAYMENTS_PUBLIC_KEY=<your nowpayments public key>`
- `NOWPAYMENTS_IPN_SECRET=<your nowpayments ipn secret>`
- `ANTHROPIC_API_KEY=<optional>`
- `OPENAI_API_KEY=<optional>`
- `QWEN_API_KEY=<optional>`

## Supabase Auth
- Site URL: `https://aiabw.com`
- Redirect URLs:
  - `https://aiabw.com`
  - `https://aiabw.com/account`
  - `https://aiabw.com/auth/login`

## Supabase Database
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
