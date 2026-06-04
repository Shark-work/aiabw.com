import Link from "next/link";
import { BadgeCheck, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getProPlanList, PRO_PLANS } from "@/lib/products";
import {
  formatSubscriptionPeriodEnd,
  getProSubscriptionSummary,
  PRO_BENEFITS,
} from "@/lib/pro-subscription";

export default async function ProPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  let summary: Awaited<ReturnType<typeof getProSubscriptionSummary>> | null = null;
  if (user) {
    const admin = createSupabaseAdminClient();
    summary = await getProSubscriptionSummary(admin, user.id);
  }

  const plans = getProPlanList();

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
          <Crown className="h-4 w-4" />
          AIABW Pro
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">解锁艾比世界 Pro 会员</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          19.9 USDT/月 或 149 USDT/年 · NOWPayments 链上支付 · 支付成功即时激活订阅权限。
        </p>
        {summary?.isPro ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            你已是 Pro 会员（{summary.planName}），到期时间：{formatSubscriptionPeriodEnd(summary.periodEnd)}
            <Button variant="secondary" size="sm" className="ml-4" asChild>
              <Link href="/account">查看账户</Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {plans.map((plan, index) => {
          const isYearly = plan.slug === "pro_yearly";
          const savings =
            isYearly &&
            `省 ${Math.round((1 - plan.priceAmount / (PRO_PLANS.pro_monthly.priceAmount * 12)) * 100)}%`;

          return (
            <Card
              key={plan.slug}
              className={`border-white/10 bg-white/5 ${isYearly ? "ring-1 ring-violet-300/40" : "ring-1 ring-cyan-300/20"}`}
            >
              <CardHeader>
                <CardDescription>{plan.description}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-white">
                  {plan.name}
                  {isYearly && savings ? (
                    <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-200">
                      {savings}
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-4xl font-semibold text-white">{plan.displayPrice}</div>
                <ul className="space-y-3 text-sm text-slate-300">
                  {PRO_BENEFITS.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={index === 1 ? "default" : "secondary"} asChild>
                  <Link href={`/checkout?plan=${plan.slug}`}>
                    订阅 {plan.name} <Zap className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="neon-card rounded-[2rem] p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              免费版对比
            </div>
            <h2 className="text-2xl font-semibold text-white">免费用户每日 3 次试用</h2>
            <p className="text-sm text-slate-300">
              Pro 会员试用聊天不限次数，创建 Agent 无上限，并可访问 Pro 专属角色与优先模型队列。
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Button className="w-full" asChild>
              <Link href="/checkout?plan=pro">立即订阅 Pro（默认月度）</Link>
            </Button>
            {!user ? (
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/auth/login">登录后订阅</Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/account">我的订阅状态</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
