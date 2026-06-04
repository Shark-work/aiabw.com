import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { href: "/admin/settings", title: "站点配置", description: "域名、统计、支付与基础配置。" },
  { href: "/admin/plans", title: "套餐管理", description: "读取并管理 subscription_plans。" },
  { href: "/admin/transactions", title: "交易管理", description: "读取并跟踪 transactions。" },
];

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, username")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "user";
  if (role !== "admin") redirect("/account");

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm text-red-100">
          Admin Console
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white">管理员后台</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          仅管理员可访问。这里用于统管站点配置、套餐、交易与后续的内容运营工具。
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full border-white/10 bg-white/5 transition hover:border-red-300/20 hover:bg-red-400/5">
              <CardHeader>
                <CardDescription className="text-red-100/70">Quick access</CardDescription>
                <CardTitle className="text-white">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-300">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>当前管理员</CardDescription>
            <CardTitle className="text-white">{profile?.display_name ?? profile?.username ?? user.email}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            <p>账号权限：{role}</p>
            <p className="mt-2 text-slate-400">User ID: {user.id}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>下一步运营动作</CardDescription>
            <CardTitle className="text-white">上线后优先处理项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>1. 检查 NOWPayments webhook 回调。</p>
            <p>2. 完成第一笔测试支付。</p>
            <p>3. 观察 GA4 页面浏览数据。</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
