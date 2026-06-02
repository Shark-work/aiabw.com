import { redirect } from "next/navigation";
import { Coins, Crown, Sparkles, UserCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types";

type AccountSubscription = {
  status: string | null;
  current_period_end: string | null;
  plan: { name?: string | null; slug?: string | null } | null;
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, role, language")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plan:subscription_plans(name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const subscription = subscriptionData as AccountSubscription | null;

  const displayName = profile?.display_name ?? profile?.username ?? user.email ?? "艾比探索者";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
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
                已登录
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
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>订阅状态</CardDescription>
            <CardTitle className="text-white">你的会员宇宙</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Coins className="h-4 w-4 text-cyan-300" />
              <span>状态：{subscription?.status ?? "未订阅"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Crown className="h-4 w-4 text-cyan-300" />
              <span>套餐：{subscription?.plan?.name ?? "暂无"}</span>
            </div>
            <p className="text-xs text-slate-500">TODO: 后续接入 Stripe / Paddle / LemonSqueezy 同步。</p>
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
          ["收藏宇宙", "你标记过的内容与 Agent 会汇聚在这里。"],
          ["创建记录", "已创建的 Agent、世界观与实验室资产。"],
          ["安全状态", "账户安全、会话状态与后续权限策略。"],
        ].map(([title, desc]) => (
          <Card key={title} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
