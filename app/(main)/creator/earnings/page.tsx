import Link from "next/link";

import { redirect } from "next/navigation";

import { ArrowDownToLine, BarChart3, Bot, TrendingUp } from "lucide-react";

import { ListPagination } from "@/components/ui/list-pagination";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { formatCreatorShareLabel } from "@/lib/creator-pricing";

import { getCreatorWalletSnapshot, listCreatorEarnings, listCreatorWithdrawals } from "@/lib/creator-wallet";
import { CREATOR_SHARE_RATE } from "@/lib/growth";
import { parsePageParam } from "@/lib/pagination";

import { createSupabaseServerClient } from "@/lib/supabase-server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";



type PageProps = {

  searchParams: Promise<{ page?: string }>;

};



const WITHDRAWAL_STATUS: Record<string, string> = {

  pending: "待处理",

  processing: "处理中",

  completed: "已完成",

  failed: "失败",

};



function maskAddress(addr: string) {

  if (addr.length <= 12) return addr;

  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;

}



export default async function CreatorEarningsPage({ searchParams }: PageProps) {

  const sp = await searchParams;

  const page = parsePageParam(sp.page);



  const supabase = await createSupabaseServerClient();

  const { data: authData } = await supabase.auth.getUser();

  const user = authData.user;



  if (!user) {

    redirect("/auth/login");

  }



  const admin = createSupabaseAdminClient();

  const userId = user.id;



  const [snapshot, { rows: earnings, pages }, withdrawals] = await Promise.all([

    getCreatorWalletSnapshot(admin, userId),

    listCreatorEarnings(admin, userId, page),

    listCreatorWithdrawals(admin, userId, 30),

  ]);



  const ratePct = Math.round(CREATOR_SHARE_RATE * 100);



  return (

    <div className="mx-auto max-w-4xl space-y-8 py-8">

      <section className="neon-card rounded-[2rem] p-8 lg:p-10">

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">

          <BarChart3 className="h-4 w-4" />

          销量统计

        </div>

        <h1 className="mt-4 text-4xl font-semibold text-white">创作者收益</h1>

        <p className="mt-4 text-slate-300">

          Agent 销售收入 {ratePct}% 归你（{formatCreatorShareLabel()}）。以下为已结算的销售明细与提现记录。

        </p>

        <div className="mt-4 flex flex-wrap gap-3">

          <Button variant="secondary" asChild>

            <Link href="/creator">创作者中心 · 提现</Link>

          </Button>

          <Button variant="secondary" asChild>

            <Link href="/leaderboard">周销量榜</Link>

          </Button>

        </div>

      </section>



      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {[

          ["累计销量", String(snapshot.salesCount), "笔"],

          ["近 7 日销量", String(snapshot.weeklySales), "笔"],

          ["累计流水", snapshot.totalGrossUsd.toFixed(2), "USD"],

          ["你的分成 (70%)", snapshot.totalEarnedUsd.toFixed(2), "USD"],

        ].map(([label, value, unit]) => (

          <Card key={label} className="border-white/10 bg-white/5">

            <CardContent className="pt-6">

              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>

              <div className="mt-2 flex items-baseline gap-1">

                <span className="text-2xl font-semibold text-white">{value}</span>

                <span className="text-sm text-slate-500">{unit}</span>

              </div>

            </CardContent>

          </Card>

        ))}

      </section>



      <Card className="border-white/10 bg-white/5">

        <CardHeader>

          <CardDescription className="flex items-center gap-2">

            <TrendingUp className="h-4 w-4" />

            钱包快照

          </CardDescription>

          <CardTitle className="text-white">可提现 {snapshot.availableUsd.toFixed(2)} USDT</CardTitle>

        </CardHeader>

        <CardContent className="flex flex-wrap gap-6 text-sm text-slate-300">

          <span>待处理提现：{snapshot.pendingUsd.toFixed(2)} USDT</span>

          <span>已提现：{snapshot.totalWithdrawnUsd.toFixed(2)} USDT</span>

          <span>最低提现：{snapshot.minWithdrawal} USDT</span>

        </CardContent>

      </Card>



      <section className="space-y-4">

        <h2 className="flex items-center gap-2 text-lg font-medium text-white">

          <ArrowDownToLine className="h-5 w-5 text-violet-300" />

          提现记录

        </h2>

        {withdrawals.length === 0 ? (

          <Card className="border-white/10 bg-white/5">

            <CardContent className="py-8 text-center text-slate-400">暂无提现记录</CardContent>

          </Card>

        ) : (

          withdrawals.map((w) => (

            <Card key={w.id} className="border-white/10 bg-white/5">

              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">

                <div>

                  <div className="font-medium text-white">{w.amountUsd.toFixed(2)} USDT</div>

                  <div className="text-slate-500">{maskAddress(w.payoutAddress)} · {w.payCurrency}</div>

                </div>

                <div className="text-right">

                  <div className="text-cyan-200">{WITHDRAWAL_STATUS[w.status] ?? w.status}</div>

                  <div className="text-slate-500">{new Date(w.createdAt).toLocaleString("zh-CN")}</div>

                </div>

              </CardContent>

            </Card>

          ))

        )}

      </section>



      <section className="space-y-4">

        <h2 className="text-lg font-medium text-white">销售明细</h2>

        {earnings.length === 0 ? (

          <Card className="border-white/10 bg-white/5">

            <CardContent className="py-12 text-center text-slate-400">

              暂无销售记录。发布 Agent 并设置定价后，用户购买将自动按 70% 结算。

              <Link href="/create" className="ml-2 text-cyan-300 underline">

                去创建

              </Link>

            </CardContent>

          </Card>

        ) : (

          earnings.map((row) => (

            <Card key={row.id} className="border-white/10 bg-white/5">

              <CardHeader>

                <CardDescription className="flex items-center gap-2">

                  <Bot className="h-4 w-4" />

                  {new Date(row.createdAt).toLocaleString("zh-CN")}

                </CardDescription>

                <CardTitle className="text-white">{row.agentName ?? "Agent 已删除"}</CardTitle>

              </CardHeader>

              <CardContent className="flex flex-wrap gap-4 text-sm text-slate-300">

                <div>

                  流水 <span className="text-white">{row.grossUsd.toFixed(2)}</span> USD

                </div>

                <div>

                  你的收益 <span className="text-cyan-200">{row.creatorUsd.toFixed(2)}</span> USD

                </div>

                <div className="text-slate-500">平台 {row.platformUsd.toFixed(2)} USD</div>

                {row.agentSlug ? (

                  <Button size="sm" variant="secondary" asChild>

                    <Link href={`/agents/${row.agentSlug}`}>查看 Agent</Link>

                  </Button>

                ) : null}

              </CardContent>

            </Card>

          ))

        )}

      </section>



      <ListPagination basePath="/creator/earnings" page={page} totalPages={pages} />

    </div>

  );

}

