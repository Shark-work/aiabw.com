"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins, Loader2, Save, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import {
  AGENT_PRICE_MAX_USDT,
  AGENT_PRICE_MIN_USDT,
  formatCreatorShareLabel,
} from "@/lib/creator-pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  { slug: "companion", label: "虚拟伴侣" },
  { slug: "story-universe", label: "故事宇宙" },
  { slug: "adventure", label: "冒险世界" },
  { slug: "meme", label: "Meme 整活" },
  { slug: "game", label: "游戏乐园" },
] as const;

const DEFAULT_FORM = {
  name: "",
  categorySlug: "companion",
  description: "",
  prompt: "",
  style: "",
  priceUsdt: "2.99",
  publish: true,
  remixSourceSlug: "" as string,
};

function CreateFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixSlug = searchParams.get("remix");

  const [form, setForm] = useState(DEFAULT_FORM);
  const [remixSourceName, setRemixSourceName] = useState<string | null>(null);
  const [loadingRemix, setLoadingRemix] = useState(Boolean(remixSlug));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!remixSlug) return;

    setLoadingRemix(true);
    fetch(`/api/agents/remix?slug=${encodeURIComponent(remixSlug)}`)
      .then((r) => r.json())
      .then(
        (json: {
          ok: boolean;
          template?: {
            name: string;
            description: string;
            prompt: string;
            categorySlug: string;
            style: string;
            priceUsdt: number;
            sourceSlug: string;
            sourceName: string;
          };
          error?: string;
        }) => {
          if (json.ok && json.template) {
            const t = json.template;
            setForm({
              name: t.name,
              categorySlug: t.categorySlug,
              description: t.description,
              prompt: t.prompt,
              style: t.style,
              priceUsdt: String(t.priceUsdt),
              publish: true,
              remixSourceSlug: t.sourceSlug,
            });
            setRemixSourceName(t.sourceName);
          } else if (json.error) {
            setError(json.error);
          }
          setLoadingRemix(false);
        }
      )
      .catch(() => setLoadingRemix(false));
  }, [remixSlug]);

  const handleSubmit = async (publish: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/agents/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, publish }),
    });

    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      message?: string;
      moderationFailed?: boolean;
      agent?: { slug: string; url: string | null };
    };

    setLoading(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? "创建失败");
      return;
    }

    setSuccess(json.message ?? "创建成功");
    if (json.agent?.url) {
      setTimeout(() => router.push(json.agent!.url!), 1200);
    }
  };

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Sparkles className="h-4 w-4" />
          {remixSlug ? "Remix · 二次创作" : "Create"}
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          {remixSlug ? "Remix 并发布你的版本" : "创建你的 Agent"}
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          {remixSlug && remixSourceName
            ? `基于「${remixSourceName}」复制而来，修改后审核发布即成为你的 Agent。`
            : "提交后将经过本地规则 + OpenAI Moderation 审核，拦截色情、暴力等违规内容。通过后保存至 Supabase。"}
        </p>
      </section>

      {loadingRemix ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> 加载 Remix 模板…
        </div>
      ) : null}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardDescription>Agent Editor</CardDescription>
          <CardTitle className="text-white">角色配置</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-slate-300">角色名称 *</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
              placeholder="例如：夜光猫娘"
              maxLength={80}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">垂类 *</span>
            <select
              value={form.categorySlug}
              onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm text-slate-300">简介 *（≥10 字）</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
              placeholder="一句话介绍你的 Agent"
              maxLength={500}
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm text-slate-300">Prompt / 人设 *（≥20 字）</span>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={6}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
              placeholder="角色性格、规则、世界观、输出方式"
              maxLength={4000}
            />
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <Coins className="h-4 w-4 text-cyan-300" />
              定价 (USDT) *
            </span>
            <input
              type="number"
              min={AGENT_PRICE_MIN_USDT}
              max={AGENT_PRICE_MAX_USDT}
              step="0.01"
              value={form.priceUsdt}
              onChange={(e) => setForm({ ...form, priceUsdt: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
            />
            <p className="text-xs text-slate-500">
              {AGENT_PRICE_MIN_USDT}～{AGENT_PRICE_MAX_USDT} USDT，0 为免费。{formatCreatorShareLabel()}。
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">你的分成预览</span>
            <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">
              {Number(form.priceUsdt) > 0
                ? `售价 ${form.priceUsdt} USDT → 你获得 ${(Number(form.priceUsdt) * 0.7).toFixed(2)} USDT`
                : "免费 Agent，不产生销售分成"}
            </div>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm text-slate-300">图像风格（可选）</span>
            <input
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
              placeholder="霓虹、赛博、可爱、梦幻"
              maxLength={200}
            />
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button disabled={loading || loadingRemix} onClick={() => void handleSubmit(true)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              审核并发布
            </Button>
            <Button variant="secondary" disabled={loading || loadingRemix} onClick={() => void handleSubmit(false)}>
              <Wand2 className="h-4 w-4" /> 保存草稿
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-50 lg:col-span-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              创建内容受 OpenAI Moderation 审核。请勿包含色情、暴力、仇恨、违法等内容。详见{" "}
              <Link href="/policies/content" className="underline">
                内容政策
              </Link>
              。
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100 lg:col-span-2">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100 lg:col-span-2">
              {success}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="py-8 text-slate-400">加载编辑器…</div>}>
      <CreateFormInner />
    </Suspense>
  );
}
