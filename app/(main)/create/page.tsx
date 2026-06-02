"use client";

import { useState } from "react";
import { Save, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreatePage() {
  const [form, setForm] = useState({ title: "", category: "", prompt: "", style: "" });

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"><Sparkles className="h-4 w-4" /> Create</div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">创建你的 Agent 玩具</h1>
        <p className="mt-4 max-w-2xl text-slate-300">用 Prompt + 性格卡 + 示例对话 + 图像风格，快速做出一个会玩、会闹、会陪你的角色。</p>
      </section>

      <Card className="border-white/10 bg-white/5">
        <CardHeader><CardDescription>Agent Editor</CardDescription><CardTitle className="text-white">角色配置</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2"><span className="text-sm text-slate-300">标题</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="例如：夜光猫娘" /></label>
          <label className="space-y-2"><span className="text-sm text-slate-300">分类</span><input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="虚拟伴侣 / 故事大师 / Meme ..." /></label>
          <label className="space-y-2 lg:col-span-2"><span className="text-sm text-slate-300">Prompt</span><textarea value={form.prompt} onChange={(e)=>setForm({...form,prompt:e.target.value})} rows={6} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="写下角色性格、规则、世界观、输出方式" /></label>
          <label className="space-y-2 lg:col-span-2"><span className="text-sm text-slate-300">图像风格</span><input value={form.style} onChange={(e)=>setForm({...form,style:e.target.value})} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="霓虹、可爱、赛博、卡通、梦幻" /></label>
          <div className="flex flex-wrap gap-3 lg:col-span-2"><Button><Save className="h-4 w-4" /> 保存草稿</Button><Button variant="secondary"><Wand2 className="h-4 w-4" /> 生成样例</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
