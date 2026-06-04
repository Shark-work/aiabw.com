import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { isProPlanSlug, PRO_PLANS, type ProPlanSlug } from "@/lib/products";
import { userHasActivePro } from "@/lib/trial-quota";

type Admin = SupabaseClient<Database>;

export const PRO_BENEFITS = [
  "无限试用聊天",
  "无限创建 Agent",
  "优先模型响应",
  "Pro 专属 Agent",
  "全站无广告",
] as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "已激活",
  trialing: "试用中",
  past_due: "待续费",
  canceled: "已取消",
  incomplete: "未完成",
};

/** Maps checkout query `plan=pro` → default monthly slug */
export function resolveSubscriptionPlanSlug(input?: string | null): ProPlanSlug | null {
  const s = (input ?? "").trim().toLowerCase();
  if (!s) return "pro_monthly";
  if (s === "pro" || s === "monthly" || s === "pro_monthly") return "pro_monthly";
  if (s === "yearly" || s === "annual" || s === "pro_yearly") return "pro_yearly";
  if (isProPlanSlug(s)) return s;
  return null;
}

export async function getProSubscriptionSummary(admin: Admin, userId: string) {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, current_period_start, current_period_end, plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  const isPro = await userHasActivePro(admin, userId);

  let planName: string | null = null;
  let planSlug: string | null = null;

  if (sub?.plan_id) {
    const { data: planRow } = await admin
      .from("subscription_plans")
      .select("name, slug")
      .eq("id", sub.plan_id)
      .maybeSingle();
    planName = planRow?.name ?? null;
    planSlug = planRow?.slug ?? null;
  }

  return {
    isPro,
    status: sub?.status ?? null,
    statusLabel: sub?.status ? (SUBSCRIPTION_STATUS_LABELS[sub.status] ?? sub.status) : "未订阅",
    planName,
    planSlug,
    periodStart: sub?.current_period_start ?? null,
    periodEnd: sub?.current_period_end ?? null,
  };
}

export function formatSubscriptionPeriodEnd(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isProExclusiveAgent(metadata: Record<string, unknown> | null | undefined): boolean {
  return metadata?.pro_only === true || metadata?.pro_exclusive === true;
}

export async function canAccessProExclusiveAgent(
  admin: Admin,
  userId: string | null,
  metadata: Record<string, unknown> | null | undefined
): Promise<boolean> {
  if (!isProExclusiveAgent(metadata)) return true;
  if (!userId) return false;
  return userHasActivePro(admin, userId);
}

export async function activateProSubscription(
  admin: Admin,
  input: {
    userId: string;
    planSlug: string;
    subscriptionStatus: "active" | "canceled";
    providerPaymentId: string;
    webhookPayload: Json;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isProPlanSlug(input.planSlug)) {
    return { ok: false, error: "Not a Pro plan slug" };
  }

  const { data: planRow, error: planError } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("slug", input.planSlug)
    .maybeSingle();

  if (planError) return { ok: false, error: planError.message };
  if (!planRow?.id) return { ok: false, error: "Subscription plan not found in database" };

  const months = PRO_PLANS[input.planSlug].intervalMonths;
  const now = new Date();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("current_period_end, status")
    .eq("user_id", input.userId)
    .maybeSingle();

  let periodStart = now;
  let periodEnd = new Date(now);

  if (
    input.subscriptionStatus === "active" &&
    existing?.current_period_end &&
    existing.status === "active" &&
    new Date(existing.current_period_end) > now
  ) {
    periodStart = new Date(existing.current_period_end);
    periodEnd = new Date(periodStart);
  }

  periodEnd.setMonth(periodEnd.getMonth() + months);

  const { error: subError } = await admin.from("subscriptions").upsert(
    {
      user_id: input.userId,
      plan_id: planRow.id,
      status: input.subscriptionStatus,
      provider: "nowpayments",
      provider_subscription_id: input.providerPaymentId,
      current_period_start:
        input.subscriptionStatus === "active" ? periodStart.toISOString() : now.toISOString(),
      current_period_end: input.subscriptionStatus === "active" ? periodEnd.toISOString() : null,
      canceled_at: input.subscriptionStatus === "canceled" ? now.toISOString() : null,
      metadata: input.webhookPayload,
    },
    { onConflict: "user_id" }
  );

  if (subError) return { ok: false, error: subError.message };

  if (input.subscriptionStatus === "active") {
    const { data: profile } = await admin
      .from("profiles")
      .select("metadata")
      .eq("user_id", input.userId)
      .maybeSingle();

    const prevMeta =
      profile?.metadata && typeof profile.metadata === "object" && !Array.isArray(profile.metadata)
        ? (profile.metadata as Record<string, unknown>)
        : {};

    await admin
      .from("profiles")
      .update({
        is_creator: true,
        metadata: { ...prevMeta, pro: true, pro_plan: input.planSlug } as Json,
      })
      .eq("user_id", input.userId);
  }

  return { ok: true };
}
