import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const SITE_KEYS = [
  "site_name",
  "site_url",
  "default_language",
  "payment_provider",
  "ga4_id",
  "creator_share_rate",
  "referral_commission_rate",
  "trial_daily_limit",
  "pro_monthly_price_usd",
  "pro_yearly_price_usd",
  "email_template_subscription_reminder",
  "email_template_creator_new_agent",
  "email_template_inactive_recall",
] as const;

const SECRET_KEYS = [
  "ops_deepseek_configured",
  "ops_qwen_configured",
  "ops_nowpayments_configured",
  "ops_resend_configured",
] as const;

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("site_settings").select("key, value");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.key] = String(row.value ?? "");

  return NextResponse.json({
    ok: true,
    config,
    envStatus: {
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      qwen: Boolean(process.env.QWEN_API_KEY),
      nowpayments: Boolean(process.env.NOWPAYMENTS_API_KEY),
      resend: Boolean(process.env.RESEND_API_KEY),
      cron: Boolean(process.env.CRON_SECRET),
    },
    keys: SITE_KEYS,
  });
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as Record<string, string>;
  const admin = createSupabaseAdminClient();

  const rows = Object.entries(body)
    .filter(([key]) => (SITE_KEYS as readonly string[]).includes(key) && !(SECRET_KEYS as readonly string[]).includes(key as never))
    .map(([key, value]) => ({ key, value: String(value) }));

  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "无有效配置项" }, { status: 400 });
  }

  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logAdminAction(admin, {
    adminUserId: auth.user.id,
    action: "update_ops_settings",
    targetType: "site_settings",
    detail: { keys: rows.map((r) => r.key) },
  });

  return NextResponse.json({ ok: true });
}
