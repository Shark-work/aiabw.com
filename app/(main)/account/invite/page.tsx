import { redirect } from "next/navigation";
import Link from "next/link";
import { Gift } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { InviteDashboard } from "@/components/growth/InviteDashboard";
import { Button } from "@/components/ui/button";

export default async function InvitePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
          <Gift className="h-4 w-4" />
          邀请计划
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white">我的邀请中心</h1>
        <p className="mt-4 text-slate-300">分享专属链接，好友消费后你获得 10% 佣金（异步结算）。</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/account">返回个人中心</Link>
        </Button>
      </section>
      <InviteDashboard />
    </div>
  );
}
