import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { CACHE_KEYS } from "@/lib/growth";
import { getCacheJson } from "@/lib/platform-cache";
import { formatPageViews, getTotalPageViews } from "@/lib/site-analytics";

export async function GET() {
  const admin = createSupabaseAdminClient();
  const stats = await getCacheJson<Record<string, unknown>>(admin, CACHE_KEYS.homeStats);

  const totalPageViews = await getTotalPageViews(admin);

  if (!stats) {
    return NextResponse.json({
      ok: true,
      cached: false,
      stats: {
        agentCount: 0,
        userCount: 0,
        weeklyAgentSales: 0,
        featuredAgents: [],
        totalPageViews,
        totalPageViewsFormatted: formatPageViews(totalPageViews),
        updatedAt: null,
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      cached: true,
      stats: { ...stats, totalPageViews, totalPageViewsFormatted: formatPageViews(totalPageViews) },
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
