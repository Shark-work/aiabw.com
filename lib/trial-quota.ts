import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { FREE_TRIAL_DAILY_LIMIT, PRO_TRIAL_DAILY_LIMIT } from "@/lib/products";

type AdminClient = SupabaseClient<Database>;

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfUtcDay(): Date {
  const start = startOfUtcDay();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export async function userHasActivePro(admin: AdminClient, userId: string): Promise<boolean> {
  const { data } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return false;
  if (!data.current_period_end) return true;
  return new Date(data.current_period_end) > new Date();
}

export async function userOwnsAgent(admin: AdminClient, userId: string, agentId: string): Promise<boolean> {
  const { data } = await admin
    .from("user_agents")
    .select("id")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .maybeSingle();
  return Boolean(data);
}

export type QuotaCheckResult =
  | { allowed: true; remaining: number; limit: number; isPro: boolean; ownsAgent: boolean }
  | { allowed: false; remaining: 0; limit: number; isPro: boolean; ownsAgent: boolean; reason: string };

export async function checkAndConsumeTrialQuota(
  admin: AdminClient,
  userId: string,
  agentId: string
): Promise<QuotaCheckResult> {
  const ownsAgent = await userOwnsAgent(admin, userId, agentId);
  if (ownsAgent) {
    return { allowed: true, remaining: PRO_TRIAL_DAILY_LIMIT, limit: PRO_TRIAL_DAILY_LIMIT, isPro: true, ownsAgent: true };
  }

  const isPro = await userHasActivePro(admin, userId);
  if (isPro) {
    return {
      allowed: true,
      remaining: PRO_TRIAL_DAILY_LIMIT,
      limit: PRO_TRIAL_DAILY_LIMIT,
      isPro: true,
      ownsAgent: false,
    };
  }

  const limit = FREE_TRIAL_DAILY_LIMIT;

  const { data: quota } = await admin
    .from("trial_quotas")
    .select("*")
    .eq("user_id", userId)
    .eq("trial_type", "chat")
    .maybeSingle();

  const resetAt = endOfUtcDay();
  let usedCount = 0;

  if (quota) {
    const quotaResetAt = quota.reset_at ? new Date(quota.reset_at) : null;
    if (quotaResetAt && quotaResetAt <= new Date()) {
      usedCount = 0;
    } else {
      usedCount = quota.used_count ?? 0;
    }
  }

  if (usedCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      isPro: false,
      ownsAgent: false,
      reason: `免费用户每日试用 ${FREE_TRIAL_DAILY_LIMIT} 次，今日已用完。升级 Pro 可无限畅聊，或购买此 Agent 永久解锁。`,
    };
  }

  const newUsed = usedCount + 1;

  if (quota) {
    await admin
      .from("trial_quotas")
      .update({ used_count: newUsed, reset_at: resetAt.toISOString(), limit_count: limit })
      .eq("user_id", userId)
      .eq("trial_type", "chat");
  } else {
    await admin.from("trial_quotas").insert({
      user_id: userId,
      trial_type: "chat",
      used_count: newUsed,
      limit_count: limit,
      reset_at: resetAt.toISOString(),
    });
  }

  return {
    allowed: true,
    remaining: limit - newUsed,
    limit,
    isPro: false,
    ownsAgent: false,
  };
}

export async function getTrialQuotaStatus(
  admin: AdminClient,
  userId: string,
  agentId: string
): Promise<{ remaining: number; limit: number; isPro: boolean; ownsAgent: boolean }> {
  const ownsAgent = await userOwnsAgent(admin, userId, agentId);
  if (ownsAgent) {
    return { remaining: PRO_TRIAL_DAILY_LIMIT, limit: PRO_TRIAL_DAILY_LIMIT, isPro: true, ownsAgent: true };
  }

  const isPro = await userHasActivePro(admin, userId);
  const limit = isPro ? PRO_TRIAL_DAILY_LIMIT : FREE_TRIAL_DAILY_LIMIT;

  const { data: quota } = await admin
    .from("trial_quotas")
    .select("*")
    .eq("user_id", userId)
    .eq("trial_type", "chat")
    .maybeSingle();

  let usedCount = 0;
  if (quota) {
    const quotaResetAt = quota.reset_at ? new Date(quota.reset_at) : null;
    if (!quotaResetAt || quotaResetAt > new Date()) {
      usedCount = quota.used_count ?? 0;
    }
  }

  return { remaining: Math.max(0, limit - usedCount), limit, isPro, ownsAgent: false };
}
