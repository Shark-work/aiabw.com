import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { cronUnauthorized, verifyCronSecret } from "@/lib/cron-auth";
import {
  processPendingRevenueEvents,
  recomputeCreatorWallets,
  recomputeHomeStats,
  recomputeReferralStatsCache,
  recomputeReferralWallets,
  recomputeWeeklyLeaderboard,
} from "@/lib/revenue-processor";

export async function POST(req: Request) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const admin = createSupabaseAdminClient();

  const revenueProcessed = await processPendingRevenueEvents(admin, 200);
  await recomputeCreatorWallets(admin);
  await recomputeReferralWallets(admin);
  await recomputeReferralStatsCache(admin);
  const leaderboard = await recomputeWeeklyLeaderboard(admin);
  const homeStats = await recomputeHomeStats(admin);

  return NextResponse.json({
    ok: true,
    revenueProcessed,
    leaderboardCount: leaderboard.length,
    homeStats,
    at: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  return POST(req);
}
