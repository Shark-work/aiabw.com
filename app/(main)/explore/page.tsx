import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { ExploreSearchPanel } from "@/components/explore/ExploreSearchPanel";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchCategories, fetchPublicAgents } from "@/lib/agents";

export const revalidate = 300;

export default async function ExplorePage() {
  const admin = createSupabaseAdminClient();
  const [initialAgents, categories] = await Promise.all([
    fetchPublicAgents(admin, 48),
    fetchCategories(admin),
  ]);

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Sparkles className="h-4 w-4" />
          Explore / 广场
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">发现你的下一个 Agent 宇宙</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          搜索名称与描述，按虚拟伴侣、RPG、故事、赛博朋克等标签筛选。结果经 pg_trgm 模糊匹配与平台缓存加速。
        </p>
      </section>

      <Suspense fallback={<div className="text-slate-400">加载探索广场…</div>}>
        <ExploreSearchPanel initialAgents={initialAgents} categories={categories} />
      </Suspense>
    </div>
  );
}
