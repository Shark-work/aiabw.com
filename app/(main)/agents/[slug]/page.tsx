import Link from "next/link";
import { ArrowRight, CopyPlus, ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const exampleDialogues = [
  { role: "你", text: "我今天想玩一个奇怪又好笑的冒险。" },
  { role: "Agent", text: "收到，已为你开启‘宇宙便利店偷月亮’支线。" },
  { role: "你", text: "能不能更离谱一点？" },
  { role: "Agent", text: "当然。现在月亮是一颗会说相声的奶酪。" },
];

export default function AgentDetailPage() {
  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Agent Detail
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">霓虹陪伴体</h1>
            <p className="max-w-2xl text-slate-300">
              一个会哄你、会接梗、会陪你进入平行世界的角色。适合陪伴、恋爱感互动、奇幻日常与轻松冒险。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="#trial">
                一键试用 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary">
              <Wand2 className="h-4 w-4" /> Remix
            </Button>
            <Button variant="outline">
              <CopyPlus className="h-4 w-4" /> 复制角色
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>角色介绍</CardDescription>
            <CardTitle className="text-white">情感、故事、陪伴三合一</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
            <p>它像一位会发光的旅伴，能根据你的输入改变语气与关系推进方式。</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["陪伴力", "高"],
                ["整活力", "中高"],
                ["冒险力", "中"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-slate-400">{a}</div>
                  <div className="mt-1 text-white">{b}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>生成图片</CardDescription>
            <CardTitle className="text-white">视觉风格卡</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(0,245,255,0.18),transparent_55%),linear-gradient(180deg,rgba(17,24,39,0.5),rgba(15,23,42,0.9))]">
              <div className="text-center text-slate-300">
                <ImagePlus className="mx-auto h-10 w-10 text-cyan-300" />
                <p className="mt-3">后续接入 Agent 图片生成 / 预览</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>示例对话</CardDescription>
            <CardTitle className="text-white">试试看它会怎么说</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exampleDialogues.map((m, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${
                  m.role === "Agent" ? "border-cyan-300/20 bg-cyan-400/10" : "border-white/10 bg-black/20"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{m.role}</div>
                <div className="mt-1 text-sm leading-6 text-white">{m.text}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="trial" className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>一键试用</CardDescription>
            <CardTitle className="text-white">沉浸式聊天入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
            <p>后续将通过 Supabase Edge Function 调用 Claude / 通义千问，并加上限流与计费控制。</p>
            <Button className="w-full">开始试用</Button>
            <Button variant="secondary" className="w-full">解锁 Pro 订阅</Button>
            <p className="text-xs text-slate-500">TODO: 连接实际会话、记忆、上下文和试用额度。</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
