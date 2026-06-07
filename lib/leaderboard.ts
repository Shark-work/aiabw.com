import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/growth";
import { getCacheJson, setCacheJson } from "@/lib/platform-cache";

type Admin = SupabaseClient<Database>;

export const WEEKLY_LEADERBOARD_TOP = 10;
export const WEEKLY_LEADERBOARD_PERIOD = "7d";

export type WeeklyLeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  salesCount: number;
  revenueUsd: number;
  grossUsd: number;
  agentCount: number;
};

export type WeeklyLeaderboardPayload = {
  ranked: WeeklyLeaderboardEntry[];
  updatedAt: string;
  period: string;
};

function weekAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

/** 从 creator_earnings 聚合过去 7 天 Top N 创作者 */
export async function computeWeeklyLeaderboard(
  admin: Admin,
  limit = WEEKLY_LEADERBOARD_TOP
): Promise<WeeklyLeaderboardEntry[]> {
  const weekAgo = weekAgoIso();

  const { data: sales } = await admin
    .from("creator_earnings")
    .select("creator_user_id, creator_usd, gross_usd, agent_id")
    .eq("status", "settled")
    .gte("created_at", weekAgo);

  const byCreator = new Map<
    string,
    { salesCount: number; revenueUsd: number; grossUsd: number; agentIds: Set<string> }
  >();

  for (const row of sales ?? []) {
    const id = row.creator_user_id;
    const cur = byCreator.get(id) ?? {
      salesCount: 0,
      revenueUsd: 0,
      grossUsd: 0,
      agentIds: new Set<string>(),
    };
    cur.salesCount += 1;
    cur.revenueUsd += Number(row.creator_usd);
    cur.grossUsd += Number(row.gross_usd);
    if (row.agent_id) cur.agentIds.add(row.agent_id);
    byCreator.set(id, cur);
  }

  const creatorIds = [...byCreator.keys()];
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, display_name, username")
    .in("user_id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? "艾比创作者"])
  );

  const sorted = [...byCreator.entries()]
    .map(([userId, stats]) => ({
      userId,
      name: profileMap.get(userId) ?? "艾比创作者",
      salesCount: stats.salesCount,
      revenueUsd: Math.round(stats.revenueUsd * 100) / 100,
      grossUsd: Math.round(stats.grossUsd * 100) / 100,
      agentCount: stats.agentIds.size,
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd || b.salesCount - a.salesCount || b.grossUsd - a.grossUsd)
    .slice(0, limit);

  return sorted.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));
}

export async function refreshWeeklyLeaderboardCache(admin: Admin): Promise<WeeklyLeaderboardEntry[]> {
  const ranked = await computeWeeklyLeaderboard(admin, WEEKLY_LEADERBOARD_TOP);
  const payload: WeeklyLeaderboardPayload = {
    ranked,
    updatedAt: new Date().toISOString(),
    period: WEEKLY_LEADERBOARD_PERIOD,
  };
  await setCacheJson(admin, CACHE_KEYS.leaderboardWeekly, payload, CACHE_TTL.leaderboard);
  return ranked;
}

export async function getWeeklyLeaderboard(admin: Admin): Promise<{
  ranked: WeeklyLeaderboardEntry[];
  updatedAt: string | null;
  period: string;
  fromCache: boolean;
}> {
  const cached = await getCacheJson<WeeklyLeaderboardPayload>(admin, CACHE_KEYS.leaderboardWeekly);

  if (cached?.ranked?.length) {
    return {
      ranked: cached.ranked.slice(0, WEEKLY_LEADERBOARD_TOP).map((row, i) => ({
        ...row,
        rank: row.rank ?? i + 1,
      })),
      updatedAt: cached.updatedAt ?? null,
      period: cached.period ?? WEEKLY_LEADERBOARD_PERIOD,
      fromCache: true,
    };
  }

  const ranked = await computeWeeklyLeaderboard(admin, WEEKLY_LEADERBOARD_TOP);
  const updatedAt = new Date().toISOString();
  await setCacheJson(
    admin,
    CACHE_KEYS.leaderboardWeekly,
    { ranked, updatedAt, period: WEEKLY_LEADERBOARD_PERIOD },
    CACHE_TTL.leaderboard
  );

  return {
    ranked,
    updatedAt,
    period: WEEKLY_LEADERBOARD_PERIOD,
    fromCache: false,
  };
}
