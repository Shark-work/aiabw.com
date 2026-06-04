-- AIABW · 数据库结构校验脚本
-- 在 Supabase Dashboard → SQL Editor 中运行，查看 missing_* 结果。
-- 若任一检查返回行，说明需执行 migration_sync_current.sql 或对应增量 migration。

-- ========== 1. 核心表是否存在 ==========
with required_tables(name) as (
  values
    ('profiles'),
    ('categories'),
    ('agents'),
    ('agent_tags'),
    ('agent_favorites'),
    ('subscription_plans'),
    ('subscriptions'),
    ('transactions'),
    ('trial_quotas'),
    ('trial_logs'),
    ('site_settings'),
    ('user_agents'),
    ('platform_cache'),
    ('invite_codes'),
    ('invite_relationships'),
    ('revenue_events'),
    ('referral_commissions'),
    ('creator_earnings'),
    ('creator_wallets'),
    ('creator_withdrawals'),
    ('referral_wallets'),
    ('referral_withdrawals'),
    ('creator_follows'),
    ('email_notification_log'),
    ('llm_user_daily_stats'),
    ('admin_audit_log')
)
select 'missing_table' as check_type, rt.name as object_name
from required_tables rt
where not exists (
  select 1 from information_schema.tables t
  where t.table_schema = 'public' and t.table_name = rt.name
);

-- ========== 2. 关键列是否存在 ==========
with required_columns(table_name, column_name) as (
  values
    ('transactions', 'order_type'),
    ('transactions', 'agent_id'),
    ('transactions', 'referral_code'),
    ('transactions', 'inviter_user_id'),
    ('agents', 'moderation_status'),
    ('agents', 'moderation_note'),
    ('agents', 'is_featured'),
    ('agents', 'sales_count'),
    ('creator_wallets', 'tron_payout_address'),
    ('creator_wallets', 'tron_bound_at'),
    ('trial_logs', 'llm_tier'),
    ('trial_logs', 'model'),
    ('trial_logs', 'cost_usd'),
    ('trial_logs', 'latency_ms')
)
select 'missing_column' as check_type, rc.table_name || '.' || rc.column_name as object_name
from required_columns rc
where not exists (
  select 1 from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = rc.table_name
    and c.column_name = rc.column_name
);

-- ========== 3. payment_status 枚举是否含 confirmed_finished ==========
select 'missing_enum_value' as check_type, 'payment_status.confirmed_finished' as object_name
where not exists (
  select 1
  from pg_enum e
  join pg_type t on e.enumtypid = t.oid
  where t.typname = 'payment_status'
    and e.enumlabel = 'confirmed_finished'
);

-- ========== 4. RPC / 函数是否存在 ==========
with required_functions(routine_name) as (
  values
    ('search_public_agents'),
    ('list_subscriptions_expiring_on_day'),
    ('list_inactive_recall_users'),
    ('handle_new_user')
)
select 'missing_function' as check_type, rf.routine_name as object_name
from required_functions rf
where not exists (
  select 1 from information_schema.routines r
  where r.routine_schema = 'public'
    and r.routine_name = rf.routine_name
);

-- ========== 5. 订阅套餐 slug（代码使用 pro_monthly / pro_yearly）==========
select 'missing_plan' as check_type, v.slug as object_name
from (values ('pro_monthly'), ('pro_yearly')) as v(slug)
where not exists (
  select 1 from public.subscription_plans sp where sp.slug = v.slug
);

-- ========== 6. site_settings 关键配置 ==========
select 'missing_site_setting' as check_type, k.key as object_name
from (
  values
    ('site_name'),
    ('ga4_id'),
    ('creator_share_rate'),
    ('trial_daily_limit'),
    ('total_page_views')
) as k(key)
where not exists (
  select 1 from public.site_settings s where s.key = k.key
);

-- ========== 7. 管理员账号 ==========
select 'missing_admin_profile' as check_type, 'profiles.role=admin' as object_name
where not exists (
  select 1 from public.profiles where role = 'admin'
);

-- ========== 8. 扩展 ==========
select 'missing_extension' as check_type, extname as object_name
from (values ('pgcrypto'), ('pg_trgm')) as e(extname)
where not exists (select 1 from pg_extension where extname = e.extname);
