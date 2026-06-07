export type PayCurrency = "usdttrc20" | "usdterc20" | "usdtbep20" | "usdcerc20";

export const PRO_PLANS = {
  pro_monthly: {
    slug: "pro_monthly",
    name: "Pro 月度",
    priceAmount: 19.9,
    priceCurrency: "USD",
    description: "AIABW Pro 月度订阅 · 19.9 USDT/月",
    intervalMonths: 1,
    displayPrice: "19.9 USDT/月",
  },
  pro_yearly: {
    slug: "pro_yearly",
    name: "Pro 年度",
    priceAmount: 149,
    priceCurrency: "USD",
    description: "AIABW Pro 年度订阅 · 149 USDT/年",
    intervalMonths: 12,
    displayPrice: "149 USDT/年",
  },
} as const;

export type ProPlanSlug = keyof typeof PRO_PLANS;

export const FREE_TRIAL_DAILY_LIMIT = 3;
export const PRO_TRIAL_DAILY_LIMIT = 999;

import { clampAgentPriceUsdt, DEFAULT_CREATOR_AGENT_PRICE_USDT } from "@/lib/creator-pricing";

export const DEFAULT_AGENT_PRICE_USDT = DEFAULT_CREATOR_AGENT_PRICE_USDT;

export function isAgentFree(metadata: Record<string, unknown> | null | undefined): boolean {
  if (metadata?.free === true) return true;
  const price = metadata?.price_usdt;
  if (price === 0 || price === "0") return true;
  if (typeof price === "number" && price <= 0) return true;
  if (typeof price === "string") {
    const parsed = parseFloat(price);
    if (!Number.isNaN(parsed) && parsed <= 0) return true;
  }
  return false;
}

export function getAgentPriceUsdt(metadata: Record<string, unknown> | null | undefined): number {
  if (isAgentFree(metadata)) return 0;
  const price = metadata?.price_usdt;
  if (typeof price === "number" && price > 0) return clampAgentPriceUsdt(price);
  if (typeof price === "string") {
    const parsed = parseFloat(price);
    if (!Number.isNaN(parsed) && parsed > 0) return clampAgentPriceUsdt(parsed);
  }
  return DEFAULT_AGENT_PRICE_USDT;
}

export function isProPlanSlug(slug: string): slug is ProPlanSlug {
  return slug in PRO_PLANS;
}

export function getProPlanList() {
  return [PRO_PLANS.pro_monthly, PRO_PLANS.pro_yearly] as const;
}
