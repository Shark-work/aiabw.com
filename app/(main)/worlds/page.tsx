import { Globe2, Orbit, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const worlds = [
  {
    title: "霓虹星港",
    description: "面向创作者和探索者的入口宇宙，适合浏览热门 Agent 和趋势内容。",
  },
  {
    title: "梦境实验室",
    description: "让提示词、角色设定与工作流在这里迅速成型并被迭代。",
  },
  {
    title: "平行档案馆",
    description: "收录不同世界观、设定模板与故事片段，供持续扩展。",
  },
];

export default function WorldsPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
          <Globe2 className="h-4 w-4" />
          Worlds
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          平行世界地图
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          用世界观划分浏览体验，让每一次点击都像从一扇门进入另一个宇宙。
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {worlds.map((world) => (
          <Card key={world.title} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>Parallel World</CardDescription>
              <CardTitle className="text-white">{world.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{world.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          { icon: Star, title: "星尘路径", desc: "推荐内容流按灵感而非标签堆砌组织。" },
          { icon: Orbit, title: "轨道探索", desc: "通过连续动作把用户带进更深层世界。" },
          { icon: Globe2, title: "多语言宇宙", desc: "不同语言入口共用同一世界观系统。" },
        ].map((item) => (
          <Card key={item.title} className="border-white/10 bg-white/5">
            <CardHeader>
              <item.icon className="h-5 w-5 text-cyan-300" />
              <CardTitle className="text-white">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
