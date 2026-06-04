import { CREATOR_SHARE_RATE, PLATFORM_SHARE_RATE } from "@/lib/growth";

/** 创作者可为 Agent 设定的 USDT 价格区间 */
export const AGENT_PRICE_MIN_USDT = 0;
export const AGENT_PRICE_MAX_USDT = 100;
export const DEFAULT_CREATOR_AGENT_PRICE_USDT = 2.99;

export function clampAgentPriceUsdt(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CREATOR_AGENT_PRICE_USDT;
  return Math.round(Math.min(AGENT_PRICE_MAX_USDT, Math.max(AGENT_PRICE_MIN_USDT, value)) * 100) / 100;
}

export function parseAgentPriceUsdt(
  input: unknown
): { ok: true; value: number; free: boolean } | { ok: false; error: string } {
  if (input === undefined || input === null || input === "") {
    return { ok: true, value: DEFAULT_CREATOR_AGENT_PRICE_USDT, free: false };
  }

  const raw = typeof input === "string" ? parseFloat(input.trim()) : Number(input);
  if (!Number.isFinite(raw)) {
    return { ok: false, error: "请填写有效的 USDT 价格。" };
  }
  if (raw < AGENT_PRICE_MIN_USDT || raw > AGENT_PRICE_MAX_USDT) {
    return {
      ok: false,
      error: `定价须在 ${AGENT_PRICE_MIN_USDT}～${AGENT_PRICE_MAX_USDT} USDT 之间。`,
    };
  }

  const value = clampAgentPriceUsdt(raw);
  return { ok: true, value, free: value <= 0 };
}

export function buildAgentPriceMetadata(
  priceUsdt: number,
  base: Record<string, unknown> = {}
): Record<string, unknown> {
  const value = clampAgentPriceUsdt(priceUsdt);
  const next: Record<string, unknown> = { ...base, price_usdt: value };
  if (value <= 0) {
    next.free = true;
  } else {
    delete next.free;
  }
  return next;
}

export function creatorEarningsFromSale(grossUsd: number) {
  const gross = Math.max(0, grossUsd);
  const creatorUsd = Math.round(gross * CREATOR_SHARE_RATE * 100) / 100;
  const platformUsd = Math.round(gross * PLATFORM_SHARE_RATE * 100) / 100;
  return { creatorUsd, platformUsd, creatorRate: CREATOR_SHARE_RATE, platformRate: PLATFORM_SHARE_RATE };
}

export function formatCreatorShareLabel(): string {
  return `平台 ${Math.round(PLATFORM_SHARE_RATE * 100)}% · 创作者 ${Math.round(CREATOR_SHARE_RATE * 100)}%`;
}
