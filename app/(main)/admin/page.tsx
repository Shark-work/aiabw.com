import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminDashboard } from "@/lib/admin-analytics";
import { fetchGa4DashboardData } from "@/lib/ga4-reporting";
import { Ga4DashboardSection } from "@/components/admin/Ga4DashboardSection";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const admin = createSupabaseAdminClient();
  const [data, ga4] = await Promise.all([fetchAdminDashboard(admin), fetchGa4DashboardData()]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="数据仪表盘"
        description="AIABW 运营核心指标 · 近 7 天趋势 · 实时业务快照"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard label="总用户数" value={data.cards.totalUsers} accent="cyan" />
        <AdminStatCard label="今日新增" value={data.cards.todayNewUsers} accent="emerald" />
        <AdminStatCard label="Pro 付费用户" value={data.cards.totalPaidUsers} accent="violet" />
        <AdminStatCard label="本月收入 (USD)" value={data.cards.monthRevenue} accent="amber" />
        <AdminStatCard label="总订单数" value={data.cards.totalOrders} accent="cyan" />
        <AdminStatCard label="Agent 总数" value={data.cards.totalAgents} accent="violet" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="近 15 分钟活跃" value={data.realtime.onlineUsers} hint="基于聊天日志估算" accent="emerald" />
        <AdminStatCard label="今日成功支付" value={data.realtime.todayPaidOrders} accent="cyan" />
        <AdminStatCard label="待处理提现" value={data.realtime.pendingWithdrawals} accent="amber" />
      </div>

      <DashboardCharts newUsers={data.trends.newUsers} revenue={data.trends.revenue} chats={data.trends.chats} />

      <Ga4DashboardSection data={ga4} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">销量 Top 10 Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topAgents.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm">
                <span className="text-slate-300">
                  <Badge className="mr-2">{i + 1}</Badge>
                  <Link href={`/agents/${a.slug}`} className="text-cyan-200 hover:underline">{a.name}</Link>
                </span>
                <span className="text-violet-200">{a.sales} 单</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">收益 Top 10 创作者</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCreators.map((c, i) => (
              <div key={c.userId} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm">
                <span className="text-slate-300">
                  <Badge className="mr-2">{i + 1}</Badge>
                  {c.name}
                </span>
                <span className="text-emerald-200">${c.earnings}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
