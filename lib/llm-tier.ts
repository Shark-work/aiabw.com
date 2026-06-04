/** 免费 → Haiku，Pro → Sonnet */
export type LlmUserTier = "free" | "pro";

export const ANTHROPIC_MODEL_FREE =
  process.env.ANTHROPIC_MODEL_FREE?.trim() ?? "claude-3-5-haiku-20241022";

export const ANTHROPIC_MODEL_PRO =
  process.env.ANTHROPIC_MODEL_PRO?.trim() ?? "claude-3-5-sonnet-20241022";

export const LLM_TIER_LABELS: Record<LlmUserTier, string> = {
  free: "Claude Haiku",
  pro: "Claude Sonnet",
};

/** 每百万 token 美元估价（Anthropic 公开价近似） */
export const MODEL_COST_PER_1M: Record<string, { input: number; output: number }> = {
  "claude-3-5-haiku-20241022": { input: 0.25, output: 1.25 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
};

export const FREE_DAILY_CALL_CAP = Number(process.env.LLM_FREE_DAILY_CALL_CAP ?? 3);
export const PRO_DAILY_CALL_CAP = Number(process.env.LLM_PRO_DAILY_CALL_CAP ?? 500);
export const FREE_DAILY_COST_CAP_USD = Number(process.env.LLM_FREE_DAILY_COST_CAP_USD ?? 0.08);
export const PRO_DAILY_COST_CAP_USD = Number(process.env.LLM_PRO_DAILY_COST_CAP_USD ?? 5);

export function resolveModelForTier(tier: LlmUserTier): string {
  return tier === "pro" ? ANTHROPIC_MODEL_PRO : ANTHROPIC_MODEL_FREE;
}

export function resolveTier(isPro: boolean, ownsAgent: boolean): LlmUserTier {
  if (isPro || ownsAgent) return "pro";
  return "free";
}

export function estimateTokenCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = MODEL_COST_PER_1M[model] ?? MODEL_COST_PER_1M[ANTHROPIC_MODEL_FREE];
  const cost =
    (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function utcTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
