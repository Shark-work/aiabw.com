import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Calendar, Coins, Crown, Gift, Receipt, Sparkles, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { formatSubscriptionPeriodEnd, getProSubscriptionSummary, PRO_BENEFITS } from "@/lib/pro-subscription";
import { AccountInviteSummary } from "@/components/account/AccountInviteSummary";
import { PaymentSuccessTracker } from "@/components/analytics/PaymentSuccessTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types";

type PageProps = {
  searchParams: Promise<{ payment?: string; order_id?: string; plan?: string }>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/auth/login");

  const admin = createSupabaseAdminClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, role, language")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = (profileData as Profile | null) ?? null;
  const subscription = await getProSubscriptionSummary(admin, user.id);

  const displayName = profile?.display_name ?? profile?.username ?? user.email ?? "艾比探索者";
  const avatarUrl = profile?.avatar_url ?? null;
  const paymentSuccess = sp.payment === "success";

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
      <PaymentSuccessTracker />
      {paymentSuccess ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          支付已提交！订阅状态将在链上确认后更新（通常数分钟内）。订单号：{sp.order_id ?? "—"}
        </div>
      ) : null}

      <section className="neon-card overflow-hidden rounded-[2rem] p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-10 w-10" />
              )}
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {subscription.isPro ? "Pro 会员" : "已登录"}
              </div>
              <h1 className="text-3xl font-semibold text-white">{displayName}</h1>
              <p className="text-sm text-slate-300">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</div>
              <div className="mt-1 text-white">{profile?.role ?? "user"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Language</div>
              <div className="mt-1 text-white">{profile?.language ?? "zh-CN"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <AccountInviteSummary userId={user.id} />

        <Card className={`border-white/10 bg-white/5 ${subscription.isPro ? "ring-1 ring-violet-300/30" : ""}`}>
          <CardHeader>
            <CardDescription>Pro 订阅</CardDescription>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className="h-5 w-5 text-violet-300" />
              你的会员宇宙
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Coins className="h-4 w-4 shrink-0 text-cyan-300" />
              <div>
                <div className="text-slate-400">订阅状态</div>
                <div className={subscription.isPro ? "text-emerald-200" : "text-white"}>{subscription.statusLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Crown className="h-4 w-4 shrink-0 text-cyan-300" />
              <div>
                <div className="text-slate-400">当前套餐</div>
                <div className="text-white">{subscription.planName ?? "未订阅 Pro"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Calendar className="h-4 w-4 shrink-0 text-cyan-300" />
              <div>
                <div className="text-slate-400">到期时间</div>
                <div className="text-white">{formatSubscriptionPeriodEnd(subscription.periodEnd)}</div>
              </div>
            </div>

            {subscription.isPro ? (
              <ul className="space-y-2 rounded-2xl border border-violet-300/20 bg-violet-400/5 p-4">
                {PRO_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-slate-300">
                    <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : (
              <Button className="w-full" asChild>
                <Link href="/checkout?plan=pro">升级 Pro · 19.9 USDT/月起</Link>
              </Button>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/account/invite">
                  <Gift className="h-4 w-4" />
                  邀请中心
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/account/orders">
                  <Receipt className="h-4 w-4" />
                  订单记录
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pro">查看 Pro 方案</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>个人资料</CardDescription>
            <CardTitle className="text-white">你的创作身份</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-slate-400">简介</div>
              <div className="mt-2 leading-6">{profile?.bio ?? "还没有填写个人简介。"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-slate-400">用户名</div>
              <div className="mt-2 text-white">{profile?.username ?? "未设置"}</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ["收藏宇宙", "你标记过的 Agent 会汇聚在这里。", "/account/favorites"],
          ["创建记录", "Pro 会员可无限创建 Agent。", "/create"],
          ["邀请返利", "好友付费你拿 10% USDT 佣金。", "/account/invite"],
        ].map(([title, desc, href]) => (
          <Card key={title} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-slate-300">{desc}</p>
              {href ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={href}>前往</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
