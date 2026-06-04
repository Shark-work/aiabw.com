"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAgentPriceUsdt } from "@/lib/products";

type HomeStats = {
  agentCount: number;
  userCount: number;
  weeklyAgentSales: number;
  featuredAgents: Array<{
    slug: string;
    name: string;
    description: string;
    metadata: Record<string, unknown> | null;
    category: { name: string } | null;
  }>;
  updatedAt: string | null;
};

export function HomeLiveSection() {
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    fetch("/api/stats/home")
      .then((r) => r.json())
      .then((json: { stats?: HomeStats }) => setStats(json.stats ?? null))
      .catch(() => undefined);
  }, []);

  const featured = stats?.featuredAgents ?? [];

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Sparkles, label: "活跃 Agent", value: stats?.agentCount ?? "—" },
          { icon: Users, label: "探索者", value: stats?.userCount ?? "—" },
          { icon: TrendingUp, label: "本周 Agent 销量", value: stats?.weeklyAgentSales ?? "—" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-cyan-300" />
                {label}
              </CardDescription>
              <CardTitle className="text-3xl text-white">{value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              缓存数据 · {stats?.updatedAt ? new Date(stats.updatedAt).toLocaleString("zh-CN") : "待刷新"}
            </CardContent>
          </Card>
        ))}
      </section>

      {featured.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-semibold text-white">热门 Agent</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.slice(0, 3).map((agent) => {
              const meta = (agent.metadata ?? {}) as Record<string, unknown>;
              const price = getAgentPriceUsdt(meta);
              return (
                <Card key={agent.slug} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardDescription>{agent.category?.name ?? "Agent"}</CardDescription>
                    <CardTitle className="text-white">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-300">{agent.description.slice(0, 60)}…</p>
                    <p className="mt-2 text-xs text-cyan-200">{price <= 0 ? "免费" : `${price} USDT`}</p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link href={`/agents/${agent.slug}`}>
                        去玩 <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
