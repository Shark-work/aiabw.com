import { BadgeCheck, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Explorer",
    price: "$0",
    description: "适合初次进入艾比世界的探索者。",
    features: ["浏览公开 Agent", "基础探索路径", "收藏与点赞"],
  },
  {
    name: "Creator",
    price: "$19",
    description: "适合创作者、策划者与日常高频使用者。",
    features: ["创建与发布 Agent", "高级世界观模板", "优先实验室权限"],
  },
  {
    name: "Universe",
    price: "$49",
    description: "适合团队和重度创作场景。",
    features: ["团队协作", "专属模型配置", "订阅级数据能力"],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
          <Coins className="h-4 w-4" />
          Membership
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">会员与订阅</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          根据你的探索深度选择合适的能力层级，后续可接入 Supabase + 支付系统。
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <Card
            key={plan.name}
            className={`border-white/10 bg-white/5 ${index === 1 ? "ring-1 ring-cyan-300/30" : ""}`}
          >
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
              <Button variant={index === 1 ? "default" : "secondary"} className="w-full">
                选择 {plan.name}
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
              TODO
            </div>
            <h2 className="text-2xl font-semibold text-white">接入支付与订阅同步</h2>
            <p className="text-sm text-slate-300">
              后续可接 Stripe / LemonSqueezy / Paddle，并写入 `subscriptions` 表。
            </p>
          </div>
          <Button className="w-fit">查看方案</Button>
        </div>
      </section>
    </div>
  );
}
