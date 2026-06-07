import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { AgentSocialActions } from "@/components/agents/AgentSocialActions";
import { AgentPurchaseButton } from "@/components/agents/AgentPurchaseButton";
import { AgentShareCard } from "@/components/agents/AgentShareCard";
import { AgentChat } from "@/components/chat/AgentChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPublicAgentBySlug } from "@/lib/agents";
import { getAgentPriceUsdt, isAgentFree } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { canAccessProExclusiveAgent } from "@/lib/pro-subscription";
import { isAgentFavorited, isFollowingCreator } from "@/lib/social";
import { getTrialQuotaStatus, userOwnsAgent } from "@/lib/trial-quota";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const agent = await fetchPublicAgentBySlug(supabase, slug);

  if (!agent) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  const isLoggedIn = Boolean(user);

  const admin = createSupabaseAdminClient();
  let ownsAgent = false;
  let trialRemaining = 3;
  let trialLimit = 3;
  let isPro = false;
  let canAccess = true;
  let favorited = false;
  let followingCreator = false;
  let creatorName: string | null = null;

  if (user) {
    ownsAgent = await userOwnsAgent(admin, user.id, agent.id);
    const quota = await getTrialQuotaStatus(admin, user.id, agent.id);
    trialRemaining = quota.remaining;
    trialLimit = quota.limit;
    isPro = quota.isPro;
    favorited = await isAgentFavorited(admin, user.id, agent.id);
    if (agent.created_by) {
      followingCreator = await isFollowingCreator(admin, user.id, agent.created_by);
      const { data: creatorProfile } = await admin
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", agent.created_by)
        .maybeSingle();
      creatorName = creatorProfile?.display_name ?? creatorProfile?.username ?? "创作者";
    }
  } else if (agent.created_by) {
    const { data: creatorProfile } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", agent.created_by)
      .maybeSingle();
    creatorName = creatorProfile?.display_name ?? creatorProfile?.username ?? "创作者";
  }

  const canFollow = Boolean(agent.created_by && user?.id !== agent.created_by);

  const metadata = (agent.metadata ?? {}) as Record<string, unknown>;
  canAccess = await canAccessProExclusiveAgent(admin, user?.id ?? null, metadata);
  const priceUsdt = getAgentPriceUsdt(metadata);
  const isFree = isAgentFree(metadata);
  const tags = Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [];
  const accent =
    typeof metadata.accent === "string"
      ? metadata.accent
      : "from-cyan-400/20 to-violet-500/10";

  return (
    <div className="space-y-8 py-8">
      <section className={`neon-card rounded-[2rem] bg-gradient-to-br ${accent} p-8 lg:p-10`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              {agent.category?.name ?? "AI Agent"}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{agent.name}</h1>
            <p className="max-w-2xl text-slate-300">{agent.description}</p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="w-full max-w-sm shrink-0">
            {!canAccess ? (
              <div className="space-y-3 rounded-2xl border border-violet-300/30 bg-violet-400/10 p-4 text-sm text-violet-100">
                <p>此 Agent 为 Pro 专属，订阅后即可解锁。</p>
                <Button className="w-full" asChild>
                  <Link href="/checkout?plan=pro">升级 Pro</Link>
                </Button>
              </div>
            ) : (
              <AgentPurchaseButton
                agentSlug={agent.slug}
                agentName={agent.name}
                priceUsdt={priceUsdt}
                isFree={isFree}
                ownsAgent={ownsAgent}
                isLoggedIn={isLoggedIn}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>角色设定</CardDescription>
            <CardTitle className="text-white">进入 TA 的世界</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
            <p>{agent.prompt ?? "沉浸式 AI 角色互动，支持试用与永久解锁。"}</p>
            <Button variant="secondary" asChild>
              <Link href="/explore">
                探索更多 Agent <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <AgentShareCard agentSlug={agent.slug} agentName={agent.name} />
          <AgentSocialActions
            agentSlug={agent.slug}
            agentName={agent.name}
            creatorUserId={agent.created_by}
            creatorName={creatorName}
            isLoggedIn={isLoggedIn}
            initialFavorited={favorited}
            initialFollowing={followingCreator}
            canFollow={canFollow}
          />
        </div>
      </section>

      <section id="trial">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>一键试用</CardDescription>
            <CardTitle className="text-white">沉浸式聊天</CardTitle>
          </CardHeader>
          <CardContent>
            {canAccess ? (
              <AgentChat
                agentSlug={agent.slug}
                agentName={agent.name}
                isLoggedIn={isLoggedIn}
                initialRemaining={trialRemaining}
                initialLimit={trialLimit}
                ownsAgent={ownsAgent}
                isPro={isPro}
              />
            ) : (
              <p className="text-sm text-slate-400">订阅 Pro 后可与此 Agent 无限畅聊。</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
