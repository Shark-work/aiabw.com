import { FlaskConical, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const labs = [
  {
    title: "Prompt Forge",
    description: "围绕角色、语气、约束和输出格式快速生成可复用提示词。",
  },
  {
    title: "World Builder",
    description: "把零散灵感组合成完整世界观骨架、设定模板与分支剧情。",
  },
  {
    title: "Agent Kitchen",
    description: "混合模型、工具与记忆结构，烹饪出可执行的 Agent 工作流。",
  },
];

export default function LabsPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <FlaskConical className="h-4 w-4" />
          Labs
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">实验室</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          用于验证新玩法、构建原型、测试提示词和探索多模态交互。
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {labs.map((lab) => (
          <Card key={lab.title} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>Experimental Space</CardDescription>
              <CardTitle className="text-white">{lab.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">{lab.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {[
          {
            icon: Wand2,
            title: "把灵感变成原型",
            desc: "从一句概念出发，快速沉淀为可测试的交互雏形。",
          },
          {
            icon: Sparkles,
            title: "让实验可复用",
            desc: "每次实验都能沉淀成模板、组件或 agent 配方。",
          },
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
