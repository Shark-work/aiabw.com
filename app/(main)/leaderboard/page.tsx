import Link from "next/link";
import { Trophy } from "lucide-react";
import { WeeklyLeaderboard } from "@/components/growth/WeeklyLeaderboard";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getWeeklyLeaderboard, WEEKLY_LEADERBOARD_TOP } from "@/lib/leaderboard";

export const revalidate = 3600;

export default async function LeaderboardPage() {
  const admin = createSupabaseAdminClient();
  const { ranked, updatedAt, period } = await getWeeklyLeaderboard(admin);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
          <Trophy className="h-4 w-4" />
          Weekly Rank · Top {WEEKLY_LEADERBOARD_TOP}
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">创作者周销量榜</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          统计过去 7 天内 Agent 销售：展示 Top {WEEKLY_LEADERBOARD_TOP} 创作者、分成收益与成交销量。数据经平台缓存加速。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" asChild>
            <Link href="/creator">创作者中心</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">探索 Agent</Link>
          </Button>
        </div>
      </section>

      <WeeklyLeaderboard
        initialRanked={ranked}
        initialUpdatedAt={updatedAt}
        initialPeriod={period}
      />
    </div>
  );
}
