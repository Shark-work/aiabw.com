import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ga4DashboardData } from "@/lib/ga4-reporting";
import { Ga4TrendChart } from "@/components/admin/Ga4TrendChart";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

type Ga4DashboardSectionProps = {
  data: Ga4DashboardData;
};

export function Ga4DashboardSection({ data }: Ga4DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-white">Google Analytics 4</h2>
        <Badge variant={data.configured && !data.error ? "success" : "default"}>
          {data.configured && !data.error ? "已连接" : "未配置"}
        </Badge>
        <span className="text-xs text-slate-500">测量 ID · G-11LB54EX3D</span>
      </div>

      {!data.configured || data.error ? (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>GA4 Data API</CardDescription>
            <CardTitle className="text-base text-slate-200">后台报表需配置服务账号</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>在 Vercel 环境变量中设置：</p>
            <ul className="list-inside list-disc space-y-1 font-mono text-xs text-cyan-200/80">
              <li>GA4_PROPERTY_ID — GA4 媒体资源数字 ID</li>
              <li>GA4_CLIENT_EMAIL — 服务账号邮箱</li>
              <li>GA4_PRIVATE_KEY — 服务账号私钥</li>
            </ul>
            {data.error ? <p className="text-amber-200/90">{data.error}</p> : null}
            <p className="text-xs">前端埋点已在生产环境自动生效，无需上述配置即可收集访问数据。</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard label="网站总访问量" value={data.totalSessions} accent="cyan" hint="累计 sessions" />
            <AdminStatCard label="今日访问量" value={data.todaySessions} accent="emerald" />
            <AdminStatCard label="近 7 天 UV" value={data.uniqueUsers} accent="violet" hint="activeUsers" />
            <AdminStatCard label="近 7 天 PV" value={data.pageViews} accent="cyan" hint="screenPageViews" />
            <AdminStatCard
              label="平均访问时长"
              value={formatDuration(data.avgSessionDurationSec)}
              accent="amber"
              hint="近 7 天"
            />
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">近 7 天访问趋势</CardTitle>
              <CardDescription>Sessions 与 Page Views</CardDescription>
            </CardHeader>
            <CardContent>
              <Ga4TrendChart data={data.trend} />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
