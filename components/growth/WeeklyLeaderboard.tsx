"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, ShoppingBag, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyLeaderboardEntry } from "@/lib/leaderboard";

type Props = {
  initialRanked?: WeeklyLeaderboardEntry[];
  initialUpdatedAt?: string | null;
  initialPeriod?: string;
};

const RANK_STYLES: Record<number, string> = {
  1: "border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-yellow-500/10 shadow-[0_0_32px_rgba(251,191,36,0.2)]",
  2: "border-slate-300/30 bg-gradient-to-br from-slate-300/15 to-slate-500/10",
  3: "border-orange-300/30 bg-gradient-to-br from-orange-400/15 to-amber-600/10",
};

function RankBadge({ rank }: { rank: number }) {
  const style =
    RANK_STYLES[rank] ??
    "border-white/10 bg-white/5 text-slate-300";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold ${style}`}
    >
      {rank <= 3 ? <Trophy className="h-5 w-5" /> : rank}
    </div>
  );
}

export function WeeklyLeaderboard({
  initialRanked = [],
  initialUpdatedAt = null,
  initialPeriod = "7d",
}: Props) {
  const [ranked, setRanked] = useState<WeeklyLeaderboardEntry[]>(initialRanked);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [period, setPeriod] = useState(initialPeriod);
  const [loading, setLoading] = useState(!initialRanked.length);

  useEffect(() => {
    if (initialRanked.length) return;

    fetch("/api/leaderboard/weekly")
      .then((r) => r.json())
      .then(
        (json: {
          ranked?: WeeklyLeaderboardEntry[];
          updatedAt?: string | null;
          period?: string;
        }) => {
          setRanked(json.ranked ?? []);
          setUpdatedAt(json.updatedAt ?? null);
          setPeriod(json.period ?? "7d");
          setLoading(false);
        }
      )
      .catch(() => setLoading(false));
  }, [initialRanked.length]);

  if (loading) {
    return <div className="text-slate-400">加载周销量排行榜…</div>;
  }

  const topThree = ranked.filter((r) => r.rank <= 3);
  const rest = ranked.filter((r) => r.rank > 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
        <span className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-300" />
          过去 {period === "7d" ? "7 天" : period} · Top {ranked.length || 10} 创作者
        </span>
        {updatedAt ? (
          <span>更新于 {new Date(updatedAt).toLocaleString("zh-CN")}</span>
        ) : (
          <span>数据每小时缓存刷新</span>
        )}
      </div>

      {ranked.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="py-12 text-center text-slate-400">
            本周暂无销售数据。创作者发布 Agent 并产生订单后将出现在榜单。
            <Link href="/create" className="ml-2 text-cyan-300 underline">
              去创建
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {topThree.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-3">
              {topThree.map((item) => (
                <Card
                  key={item.userId}
                  className={`border-white/10 ${RANK_STYLES[item.rank] ?? "bg-white/5"}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <RankBadge rank={item.rank} />
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg text-white">{item.name}</CardTitle>
                        <CardDescription>第 {item.rank} 名</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-cyan-300" />
                        收益 (70%)
                      </span>
                      <span className="font-semibold text-cyan-200">{item.revenueUsd.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        销量
                      </span>
                      <span className="text-white">{item.salesCount} 笔</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>流水</span>
                      <span>{item.grossUsd.toFixed(2)} USD</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="grid grid-cols-[3rem_1fr_repeat(3,minmax(4rem,auto))] gap-2 border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
              <span>#</span>
              <span>创作者</span>
              <span className="text-right">收益 (USDT)</span>
              <span className="text-right">销量</span>
              <span className="text-right hidden sm:block">Agent</span>
            </div>
            <ul>
              {(rest.length > 0 ? rest : ranked).map((item) => (
                <li
                  key={item.userId}
                  className="grid grid-cols-[3rem_1fr_repeat(3,minmax(4rem,auto))] items-center gap-2 border-b border-white/5 px-4 py-3.5 text-sm last:border-0 hover:bg-cyan-400/5"
                >
                  <span className="font-semibold text-slate-400">{item.rank}</span>
                  <span className="truncate font-medium text-white">{item.name}</span>
                  <span className="text-right font-medium text-cyan-200">{item.revenueUsd.toFixed(2)}</span>
                  <span className="text-right text-slate-300">{item.salesCount}</span>
                  <span className="text-right text-slate-500 hidden sm:flex items-center justify-end gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {item.agentCount}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="text-xs text-slate-500">
        排名按过去 7 天已结算的创作者分成收益排序；销量为成交笔数，收益为 70% 分成 USDT 估值。数据由
        <Link href="/creator" className="mx-1 text-cyan-300 underline">
          Cron
        </Link>
        写入缓存，页面优先读缓存。
      </p>
    </div>
  );
}
