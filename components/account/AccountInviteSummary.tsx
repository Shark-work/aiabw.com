import Link from "next/link";
import { Gift, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getReferralDashboard } from "@/lib/referral-wallet";

type Props = {
  userId: string;
};

export async function AccountInviteSummary({ userId }: Props) {
  const admin = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dashboard = await getReferralDashboard(admin, userId, appUrl);
  const ratePct = Math.round(dashboard.commissionRate * 100);

  return (
    <Card className="border-violet-300/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 lg:col-span-2">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-violet-300" />
          邀请返利 · {ratePct}% 佣金
        </CardDescription>
        <CardTitle className="text-white">我的邀请收益</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="h-3.5 w-3.5" /> 邀请人数
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">{dashboard.inviteCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-slate-400">累计佣金 (USD)</div>
            <div className="mt-1 text-2xl font-semibold text-cyan-200">
              {dashboard.totalCommissionUsd.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
            <div className="flex items-center gap-2 text-xs text-violet-200">
              <Wallet className="h-3.5 w-3.5" /> 可提现 USDT
            </div>
            <div className="mt-1 text-2xl font-semibold text-violet-100">
              {dashboard.availableUsd.toFixed(2)}
            </div>
          </div>
        </div>
        <p className="break-all text-xs text-slate-500">{dashboard.inviteLink}</p>
        <Button asChild>
          <Link href="/account/invite">进入邀请中心 · 复制链接 / 提现</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
