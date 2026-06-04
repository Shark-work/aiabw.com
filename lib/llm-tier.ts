/** 免费 → DeepSeek，Pro → 通义千问 Qwen */
export type LlmUserTier = "free" | "pro";

export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL?.trim() ?? "https://api.deepseek.com/v1";

export const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL?.trim() ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export const DEEPSEEK_MODEL_FREE =
  process.env.DEEPSEEK_MODEL?.trim() ?? "deepseek-chat";

export const QWEN_MODEL_PRO = process.env.QWEN_MODEL?.trim() ?? "qwen3.6-plus";

export const LLM_TIER_LABELS: Record<LlmUserTier, string> = {
  free: "DeepSeek V4-Flash",
  pro: "Qwen3.6-Plus",
};

/** 每百万 token 美元估价（公开价近似，用于成本统计） */
export const MODEL_COST_PER_1M: Record<string, { input: number; output: number }> = {
  "deepseek-chat": { input: 0.27, output: 1.1 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
  "qwen3.6-plus": { input: 2.0, output: 6.0 },
  "qwen-plus": { input: 0.4, output: 1.2 },
};

export const FREE_DAILY_CALL_CAP = Number(process.env.LLM_FREE_DAILY_CALL_CAP ?? 3);
export const PRO_DAILY_CALL_CAP = Number(process.env.LLM_PRO_DAILY_CALL_CAP ?? 500);
export const FREE_DAILY_COST_CAP_USD = Number(process.env.LLM_FREE_DAILY_COST_CAP_USD ?? 0.08);
export const PRO_DAILY_COST_CAP_USD = Number(process.env.LLM_PRO_DAILY_COST_CAP_USD ?? 5);

export function resolveModelForTier(tier: LlmUserTier): string {
  return tier === "pro" ? QWEN_MODEL_PRO : DEEPSEEK_MODEL_FREE;
}

export function resolveProviderForTier(tier: LlmUserTier): "deepseek" | "qwen" {
  return tier === "pro" ? "qwen" : "deepseek";
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
  const rates = MODEL_COST_PER_1M[model] ?? MODEL_COST_PER_1M[DEEPSEEK_MODEL_FREE];
  const cost =
    (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function utcTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
