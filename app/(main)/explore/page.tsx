import Link from "next/link";
import { ArrowRight, Dice5, Heart, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = [
  "虚拟伴侣",
  "故事大师",
  "游戏 GM",
  "Meme 狂魔",
  "奇幻世界",
  "恐怖怪谈",
  "治愈陪伴",
];

const agents = [
  { id: "neon-companion", name: "霓虹陪伴体", desc: "会哄人、会接梗、会陪你熬夜。", tag: "虚拟伴侣" },
  { id: "meme-wizard", name: "Meme 狂魔", desc: "专门负责整活、反转、抽象输出。", tag: "搞笑" },
  { id: "dungeon-gm", name: "地下城 GM", desc: "任务、奖励、Boss、骰子与意外事件。", tag: "游戏 GM" },
  { id: "fairy-story", name: "奇幻故事大师", desc: "把你的人设变成会持续生长的剧情。", tag: "故事共创" },
];

export default function ExplorePage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Sparkles className="h-4 w-4" />
          Explore / 广场
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">随机发现一位今天最适合你的 Agent</h1>
        <p className="mt-4 max-w-2xl text-slate-300">按情绪、玩法和世界观快速筛选。这里是乐园的广场，也是你的抽卡入口。</p>
      </section>

      <section className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <button key={c} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white">
            {c}
          </button>
        ))}
        <Button variant="outline" className="ml-auto">
          <Dice5 className="h-4 w-4" /> 随机发现
        </Button>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>{agent.tag}</CardDescription>
              <CardTitle className="text-white">{agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{agent.desc}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" asChild><Link href={`/agents/${agent.id}`}>详情 <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button size="sm" variant="secondary"><Heart className="h-4 w-4" /> 收藏</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
