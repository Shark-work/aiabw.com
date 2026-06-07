import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { getCacheJson, setCacheJson } from "@/lib/platform-cache";

type Admin = SupabaseClient<Database>;

const MIN_INTERVAL_MS = 2000;

type WindowConfig = { limit: number; windowMs: number };

const FREE_USER_WINDOWS: WindowConfig[] = [
  { limit: 6, windowMs: 60_000 },
  { limit: 24, windowMs: 3_600_000 },
];

const PRO_USER_WINDOWS: WindowConfig[] = [
  { limit: 20, windowMs: 60_000 },
  { limit: 200, windowMs: 3_600_000 },
];

const FREE_IP_WINDOWS: WindowConfig[] = [
  { limit: 15, windowMs: 60_000 },
  { limit: 80, windowMs: 3_600_000 },
];

const PRO_IP_WINDOWS: WindowConfig[] = [
  { limit: 30, windowMs: 60_000 },
  { limit: 200, windowMs: 3_600_000 },
];

type BucketStore = Map<string, number[]>;

const globalStore = globalThis as typeof globalThis & {
  __aiabwRateLimit?: BucketStore;
  __aiabwLastRequest?: Map<string, number>;
};

function getStore(): BucketStore {
  if (!globalStore.__aiabwRateLimit) globalStore.__aiabwRateLimit = new Map();
  return globalStore.__aiabwRateLimit;
}

function getLastRequestMap(): Map<string, number> {
  if (!globalStore.__aiabwLastRequest) globalStore.__aiabwLastRequest = new Map();
  return globalStore.__aiabwLastRequest;
}

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

function hitInMemory(key: string, limit: number, windowMs: number): boolean {
  const store = getStore();
  const now = Date.now();
  const prev = store.get(key) ?? [];
  const pruned = pruneTimestamps(prev, windowMs, now);
  if (pruned.length >= limit) {
    store.set(key, pruned);
    return false;
  }
  pruned.push(now);
  store.set(key, pruned);
  return true;
}

function checkMinInterval(userKey: string): boolean {
  const map = getLastRequestMap();
  const now = Date.now();
  const last = map.get(userKey) ?? 0;
  if (now - last < MIN_INTERVAL_MS) return false;
  map.set(userKey, now);
  return true;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterSec?: number };

export function checkChatRateLimitMemory(userId: string, ip: string, isPro = false): RateLimitResult {
  if (!checkMinInterval(`user:${userId}`)) {
    return { allowed: false, reason: "发送太快了，请稍候再试。", retryAfterSec: 2 };
  }

  const userWindows = isPro ? PRO_USER_WINDOWS : FREE_USER_WINDOWS;
  for (const w of userWindows) {
    if (!hitInMemory(`u:${userId}:${w.windowMs}`, w.limit, w.windowMs)) {
      return { allowed: false, reason: "操作过于频繁，请稍后再试。", retryAfterSec: 30 };
    }
  }

  const ipKey = ip || "unknown";
  const ipWindows = isPro ? PRO_IP_WINDOWS : FREE_IP_WINDOWS;
  for (const w of ipWindows) {
    if (!hitInMemory(`ip:${ipKey}:${w.windowMs}`, w.limit, w.windowMs)) {
      return { allowed: false, reason: "当前网络请求过多，请稍后再试。", retryAfterSec: 60 };
    }
  }

  return { allowed: true };
}

/** 跨实例 IP 小时级防刷（Supabase platform_cache） */
export async function checkChatRateLimitDistributed(
  admin: Admin,
  ip: string
): Promise<RateLimitResult> {
  if (!ip || ip === "unknown") return { allowed: true };

  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const cacheKey = `rl:ip:${ip}:${hourBucket}`;
  const cached = await getCacheJson<{ count: number }>(admin, cacheKey);
  const count = cached?.count ?? 0;

  if (count >= 150) {
    return { allowed: false, reason: "当前网络请求过多，请稍后再试。", retryAfterSec: 300 };
  }

  await setCacheJson(admin, cacheKey, { count: count + 1 } as Json, 3600);
  return { allowed: true };
}

export function hashDuplicateMessage(userId: string, agentSlug: string, message: string): string {
  const normalized = message.trim().toLowerCase().slice(0, 500);
  return createHash("sha256").update(`${userId}:${agentSlug}:${normalized}`).digest("hex").slice(0, 24);
}

const duplicateStore = globalStore as typeof globalStore & {
  __aiabwDup?: Map<string, number>;
};

function getDupStore(): Map<string, number> {
  if (!duplicateStore.__aiabwDup) duplicateStore.__aiabwDup = new Map();
  return duplicateStore.__aiabwDup;
}

/** 5 秒内相同消息视为刷接口 */
export function checkDuplicateSpam(userId: string, agentSlug: string, message: string): RateLimitResult {
  const key = hashDuplicateMessage(userId, agentSlug, message);
  const store = getDupStore();
  const now = Date.now();
  const last = store.get(key);
  if (last && now - last < 5000) {
    return { allowed: false, reason: "请勿重复发送相同内容。", retryAfterSec: 5 };
  }
  store.set(key, now);
  return { allowed: true };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
