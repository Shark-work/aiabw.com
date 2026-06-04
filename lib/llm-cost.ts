import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import {
  estimateTokenCostUsd,
  FREE_DAILY_CALL_CAP,
  FREE_DAILY_COST_CAP_USD,
  PRO_DAILY_CALL_CAP,
  PRO_DAILY_COST_CAP_USD,
  type LlmUserTier,
  utcTodayIso,
} from "@/lib/llm-tier";

type Admin = SupabaseClient<Database>;

export type DailyUsageStats = {
  callCount: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
};

export async function getUserDailyLlmStats(admin: Admin, userId: string): Promise<DailyUsageStats> {
  const day = utcTodayIso();
  const { data } = await admin
    .from("llm_user_daily_stats")
    .select("call_count, prompt_tokens, completion_tokens, cost_usd")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  return {
    callCount: data?.call_count ?? 0,
    promptTokens: Number(data?.prompt_tokens ?? 0),
    completionTokens: Number(data?.completion_tokens ?? 0),
    costUsd: Number(data?.cost_usd ?? 0),
  };
}

export type DailyLimitResult =
  | { allowed: true; stats: DailyUsageStats }
  | { allowed: false; reason: string; stats: DailyUsageStats };

export async function checkDailyLlmLimits(
  admin: Admin,
  userId: string,
  tier: LlmUserTier
): Promise<DailyLimitResult> {
  const stats = await getUserDailyLlmStats(admin, userId);
  const callCap = tier === "pro" ? PRO_DAILY_CALL_CAP : FREE_DAILY_CALL_CAP;
  const costCap = tier === "pro" ? PRO_DAILY_COST_CAP_USD : FREE_DAILY_COST_CAP_USD;

  if (stats.callCount >= callCap) {
    return {
      allowed: false,
      stats,
      reason:
        tier === "pro"
          ? `Pro 用户每日对话上限 ${callCap} 次，请明日再试。`
          : `免费用户每日 ${callCap} 次试用已用完，升级 Pro 解锁 Qwen3.6-Plus 与更高额度。`,
    };
  }

  if (stats.costUsd >= costCap) {
    return {
      allowed: false,
      stats,
      reason: "今日 AI 调用成本已达上限，请明日再试或升级 Pro。",
    };
  }

  return { allowed: true, stats };
}

export async function recordLlmUsage(
  admin: Admin,
  input: {
    userId: string;
    agentId: string;
    tier: LlmUserTier;
    model: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    status?: string;
    raw?: Json;
  }
): Promise<{ costUsd: number }> {
  const costUsd = estimateTokenCostUsd(input.model, input.promptTokens, input.completionTokens);
  const day = utcTodayIso();

  const stats = await getUserDailyLlmStats(admin, input.userId);

  await admin.from("llm_user_daily_stats").upsert(
    {
      user_id: input.userId,
      day,
      call_count: stats.callCount + 1,
      prompt_tokens: stats.promptTokens + input.promptTokens,
      completion_tokens: stats.completionTokens + input.completionTokens,
      cost_usd: Math.round((stats.costUsd + costUsd) * 1_000_000) / 1_000_000,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );

  await admin.from("trial_logs").insert({
    user_id: input.userId,
    agent_id: input.agentId,
    provider: input.provider,
    prompt_tokens: input.promptTokens,
    completion_tokens: input.completionTokens,
    llm_tier: input.tier,
    model: input.model,
    cost_usd: costUsd,
    latency_ms: input.latencyMs,
    status: input.status ?? "ok",
    raw: (input.raw ?? {}) as Json,
  });

  return { costUsd };
}

export async function getPlatformDailyCostSummary(admin: Admin): Promise<{
  day: string;
  totalCalls: number;
  totalCostUsd: number;
}> {
  const day = utcTodayIso();
  const { data } = await admin.from("llm_user_daily_stats").select("call_count, cost_usd").eq("day", day);

  const totalCalls = (data ?? []).reduce((s, r) => s + (r.call_count ?? 0), 0);
  const totalCostUsd = (data ?? []).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);

  return { day, totalCalls, totalCostUsd: Math.round(totalCostUsd * 100) / 100 };
}
