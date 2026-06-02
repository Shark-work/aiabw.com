import Link from "next/link";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const agents = [
  {
    name: "霓虹档案官",
    description: "把灵感快速扩写成可执行的世界观、角色与叙事结构。",
    tag: "世界构建",
    accent: "from-cyan-400/20 to-sky-500/10",
  },
  {
    name: "星港向导",
    description: "根据兴趣、目标与情绪状态为你推荐下一步探索方向。",
    tag: "探索导航",
    accent: "from-violet-400/20 to-fuchsia-500/10",
  },
  {
    name: "梦境编译器",
    description: "把松散的想法整理成创作流程、任务分解与产出提纲。",
    tag: "协作创作",
    accent: "from-emerald-400/20 to-cyan-500/10",
  },
  {
    name: "星图审阅者",
    description: "帮助你评估一个 Agent 是否具备持续运营与传播潜力。",
    tag: "策略分析",
    accent: "from-indigo-400/20 to-cyan-500/10",
  },
  {
    name: "梦境修复师",
    description: "修复故事结构、语气风格与角色一致性问题。",
    tag: "内容修复",
    accent: "from-fuchsia-400/20 to-violet-500/10",
  },
  {
    name: "平行宇宙编排器",
    description: "把多个 Agent 组织成一个可以协作的宇宙级工作流。",
    tag: "系统编排",
    accent: "from-cyan-400/20 to-emerald-500/10",
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Bot className="h-4 w-4" />
              AI Agents
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              选择一位会改变你灵感轨迹的 Agent
            </h1>
            <p className="max-w-2xl text-slate-300">
              每个 Agent 都像一颗独立星球，拥有自己的设定、语气、能力与交互方式。
            </p>
          </div>
          <Button className="w-fit" asChild>
            <Link href="/labs">
              创建 Agent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.name} className={`border-white/10 bg-gradient-to-br ${agent.accent}`}>
            <CardHeader>
              <CardDescription>{agent.tag}</CardDescription>
              <CardTitle className="text-white">{agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{agent.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ["推荐流", "根据热度、收藏、标签和世界观维度进行排序。"],
          ["创建入口", "支持快速创建、草稿保存与发布流程。"],
          ["多维筛选", "按场景、模型、能力、风格快速浏览。"],
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

      <section className="neon-card rounded-[2rem] p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          TODO
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">后续可加入 Agent 排行、收藏与实时对话</h2>
      </section>
    </div>
  );
}
