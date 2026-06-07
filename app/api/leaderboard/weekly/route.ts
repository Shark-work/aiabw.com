import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getWeeklyLeaderboard, WEEKLY_LEADERBOARD_TOP } from "@/lib/leaderboard";

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { ranked, updatedAt, period, fromCache } = await getWeeklyLeaderboard(admin);

  return NextResponse.json(
    {
      ok: true,
      top: WEEKLY_LEADERBOARD_TOP,
      cached: fromCache,
      period,
      updatedAt,
      ranked,
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
