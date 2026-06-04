import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { listUserFavoriteAgents } from "@/lib/social";

export default async function AccountFavoritesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/auth/login?next=/account/favorites");
  }

  const admin = createSupabaseAdminClient();
  const favorites = await listUserFavoriteAgents(admin, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-400/10 px-4 py-2 text-sm text-pink-100">
          <Heart className="h-4 w-4" />
          收藏宇宙
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white">我的收藏</h1>
        <p className="mt-4 text-slate-300">你标记过的 Agent 会汇聚在这里，共 {favorites.length} 个。</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/account">返回个人中心</Link>
        </Button>
      </section>

      {favorites.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="py-12 text-center text-slate-400">
            还没有收藏任何 Agent。
            <Link href="/explore" className="ml-2 text-cyan-300 underline">
              去探索
            </Link>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {favorites.map((item) => (
            <Card key={item.agentId} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardDescription>{item.categoryName ?? "Agent"}</CardDescription>
                <CardTitle className="text-white">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-slate-300">{item.description}</p>
                <p className="text-xs text-slate-500">
                  收藏于 {new Date(item.favoritedAt).toLocaleString("zh-CN")}
                </p>
                <Button size="sm" asChild>
                  <Link href={`/agents/${item.slug}`}>
                    进入 Agent <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
