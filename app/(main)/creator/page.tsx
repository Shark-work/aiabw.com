import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Palette } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CreatorMyAgentsPricing } from "@/components/creator/CreatorMyAgentsPricing";
import { CreatorWalletPanel } from "@/components/growth/CreatorWalletPanel";
import { formatCreatorShareLabel } from "@/lib/creator-pricing";
import { Button } from "@/components/ui/button";

export default async function CreatorPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Palette className="h-4 w-4" />
          Creator Hub
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white">创作者中心</h1>
        <p className="mt-4 text-slate-300">
          为 Agent 定价 0～100 USDT。{formatCreatorShareLabel()}。绑定 TRON 地址后满 10 USDT 自动打款提现。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/creator/earnings">
              <BarChart3 className="h-4 w-4" />
              销量统计
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/leaderboard">周销量榜</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/create">创建 Agent</Link>
          </Button>
        </div>
      </section>
      <CreatorMyAgentsPricing />
      <CreatorWalletPanel />
    </div>
  );
}
