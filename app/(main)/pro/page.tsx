import Link from "next/link";
import { BadgeCheck, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    slug: "explorer",
    name: "Explorer",
    price: "$0",
    description: "轻量入门，适合先逛一逛、试一试。",
    features: ["浏览公开 Agent", "有限试用额度", "基础收藏/点赞"],
  },
  {
    slug: "creator",
    name: "Creator",
    price: "$19",
    description: "适合高频玩耍、创作与角色共创。",
    features: ["更多试用额度", "创建/发布 Agent", "高级模板与 Remix"],
  },
  {
    slug: "universe",
    name: "Universe",
    price: "$49",
    description: "适合重度玩家与团队协作。",
    features: ["团队协作", "专属世界观包", "优先实验室权限"],
  },
];

export default function ProPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
          <Crown className="h-4 w-4" />
          Pro Membership
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">解锁更好玩的世界门票</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          你可以把 Pro 理解成“更多抽卡次数 + 更强试用额度 + 更高创作权限”。
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`border-white/10 bg-white/5 ${index === 1 ? "ring-1 ring-cyan-300/30" : ""}`}>
            <CardHeader>
              <CardDescription>{plan.description}</CardDescription>
              <CardTitle className="text-white">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-4xl font-semibold text-white">{plan.price}</div>
              <ul className="space-y-3 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={index === 1 ? "default" : "secondary"} asChild>
                <Link href={`/checkout?plan=${plan.slug}`}>选择 {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="neon-card rounded-[2rem] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              变现路径
            </div>
            <h2 className="text-2xl font-semibold text-white">支付后自动解锁更高试用额度与创作权限</h2>
            <p className="text-sm text-slate-300">后续接 NOWPayments，支持 USDT / USDC，以及订阅状态同步到 Supabase。</p>
          </div>
          <Button className="w-fit" asChild>
            <Link href="/checkout?plan=creator">前往支付页</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
