import Link from "next/link";
import {
  ArrowRight,
  BadgeInfo,
  BrainCircuit,
  Compass,
  Dice5,
  Layers3,
  Orbit,
  PanelsTopLeft,
  Sparkles,
  Stars,
  Wand2,
} from "lucide-react";
import { ParticleField } from "@/components/effects/ParticleField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const randomPicks = ["猫娘恋爱顾问", "地牢GM·深夜版", "Meme 狂魔", "奇幻勇者团", "赛博陪伴体", "搞笑整活王"];
const featuredAgents = [
  { name: "霓虹档案官", category: "世界观生成", description: "把一句灵感扩写成完整角色卡。", accent: "from-cyan-400/20 to-sky-500/10" },
  { name: "星港向导", category: "探索导航", description: "推荐适合你现在心情的玩伴。", accent: "from-violet-400/20 to-fuchsia-500/10" },
  { name: "梦境编译器", category: "创作协作", description: "把散乱想法组织成可玩剧情。", accent: "from-emerald-400/20 to-cyan-500/10" },
];
const worlds = [
  { name: "虚拟伴侣", tag: "陪伴", detail: "温柔、黏人、会接梗的 AI 角色。" },
  { name: "故事大师", tag: "共创", detail: "开放式剧情、分支冒险、长篇设定。" },
  { name: "游戏 GM", tag: "冒险", detail: "跑团、解谜、探索、任务生成。" },
  { name: "Meme 狂魔", tag: "搞笑", detail: "梗图、抽象、整活、社死喜剧。" },
];

export default function Home() {
  return (
    <div className="relative isolate py-6 sm:py-10 lg:py-14">
      <ParticleField />
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,15,33,0.82),rgba(6,10,23,0.92))] px-6 py-8 shadow-[0_0_120px_rgba(0,245,255,0.08)] backdrop-blur-xl sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,255,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"><Sparkles className="h-4 w-4" />PlayAgent Sphere · 奇妙Agent乐园</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">立刻开始玩，进入一个会回应你的<span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">AI Agent 乐园</span></h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">专注娱乐、角色扮演、故事共创、虚拟陪伴、奇幻冒险与搞笑 Meme。抽一位角色，开启你的下一段奇妙冒险。</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="group" asChild><Link href="/explore">立刻开始玩 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></Button>
              <Button variant="secondary" size="lg" asChild><Link href="/create">创建我的 Agent</Link></Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">{[["随机推荐", "每天换一批好玩角色"],["移动端优先", "一手就能玩起来"],["中英双语", "随时切换世界语言"]].map(([v,l])=> <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-2xl font-semibold text-white">{v}</div><div className="mt-1 text-sm text-slate-400">{l}</div></div>)}</div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
            <Card className="relative overflow-hidden border-cyan-300/20 bg-slate-950/70">
              <CardHeader className="pb-4"><CardDescription className="text-cyan-200/80">今日随机角色推荐</CardDescription><CardTitle className="text-2xl text-white">抽到什么就玩什么</CardTitle></CardHeader>
              <CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3">{randomPicks.map((name)=> <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-400/10"><Dice5 className="h-4 w-4 text-cyan-300" /> <div className="mt-3 font-medium">{name}</div></div>)}</div><Button variant="outline" className="w-full" asChild><Link href="/explore">换一批随机推荐</Link></Button></CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-white/10 bg-white/5"><CardHeader><CardDescription>探索路径</CardDescription><CardTitle className="text-white">像穿越星门一样开始浏览</CardTitle></CardHeader><CardContent className="space-y-4">{["选择你想玩的分类","进入 Agent 详情页试用","Remix、订阅或收藏"].map((step, index)=><div key={step} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">0{index+1}</div><p className="pt-1 text-sm leading-6 text-slate-300">{step}</p></div>)}</CardContent></Card>
        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{featuredAgents.map((agent)=><Card key={agent.name} className={`overflow-hidden border-white/10 bg-gradient-to-br ${agent.accent}`}><CardHeader><CardDescription>{agent.category}</CardDescription><CardTitle className="text-white">{agent.name}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-200/90">{agent.description}</p></CardContent></Card>)}</div>
      </section>
      <section className="mt-8 grid gap-5 lg:grid-cols-4">{worlds.map((w)=><Card key={w.name} className="border-white/10 bg-white/5"><CardHeader><CardDescription>{w.tag}</CardDescription><CardTitle className="text-white">{w.name}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-300">{w.detail}</p><Button className="mt-4 w-full" variant="secondary" asChild><Link href="/explore">进入</Link></Button></CardContent></Card>)}</section>
      <section className="mt-8 grid gap-5 lg:grid-cols-3">{[["沉浸式首页", "用抽卡式随机推荐强化“玩”的感觉。"],["shadcn 体系", "按钮、卡片、布局统一高级感。"],["动效策略", "粒子、光晕、玻璃态构建奇幻氛围。"]].map(([title, desc])=><Card key={title} className="border-white/10 bg-white/5"><CardHeader><CardTitle className="text-white">{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-300">{desc}</p></CardContent></Card>)}</section>
      <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"><Card className="border-white/10 bg-white/5"><CardHeader><CardDescription>玩法矩阵</CardDescription><CardTitle className="text-white">你可以怎么玩</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-slate-300">{[["虚拟伴侣","更像会陪你聊天的角色伙伴"],["故事大师","连载剧情、分支冒险、共同写作"],["游戏 GM","地牢、任务、随机事件"],["Meme 狂魔","抽象、吐槽、梗图与整活"],["奇幻世界","龙、魔法、王国、史诗冒险"]].map(([a,b])=><div key={a} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="font-medium text-white">{a}</div><div className="mt-1">{b}</div></div>)}</CardContent></Card><Card className="border-white/10 bg-white/5"><CardHeader><CardDescription>产品闭环</CardDescription><CardTitle className="text-white">从玩到付费的一条线</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-slate-300"><div className="flex gap-3"><Orbit className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />随机推荐 → 详情页试用</div><div className="flex gap-3"><Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />沉浸聊天 → Remix / 收藏</div><div className="flex gap-3"><BadgeInfo className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Pro 订阅 → USDT/USDC 支付</div><div className="flex gap-3"><Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />创作页 → 发布新 Agent</div></CardContent></Card></section>
      <section className="mt-8 grid gap-5 lg:grid-cols-3">{[["虚拟伴侣", "陪伴、情感、黏人、会接梗"],["奇幻冒险", "异世界、地牢、任务、Boss"],["搞笑 Meme", "抽象、整活、病毒传播"]].map(([title, desc])=><Card key={title} className="border-white/10 bg-white/5"><CardHeader><CardTitle className="text-white">{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-300">{desc}</p></CardContent></Card>)}</section>
    </div>
  );
}
