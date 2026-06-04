"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AGENT_PRICE_MAX_USDT,
  AGENT_PRICE_MIN_USDT,
  formatCreatorShareLabel,
} from "@/lib/creator-pricing";

type AgentRow = {
  slug: string;
  name: string;
  priceUsdt: number;
  status: string;
};

export function CreatorMyAgentsPricing() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/creator/agents", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean; agents?: AgentRow[] }) => {
        if (json.ok && json.agents) {
          setAgents(json.agents);
          setDrafts(Object.fromEntries(json.agents.map((a) => [a.slug, String(a.priceUsdt)])));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const savePrice = async (slug: string) => {
    setSaving(slug);
    setMessage(null);
    const res = await fetch("/api/agents/price", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug: slug, priceUsdt: drafts[slug] }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string; message?: string; priceUsdt?: number };
    setSaving(null);
    if (!json.ok) {
      setMessage(json.error ?? "保存失败");
      return;
    }
    setMessage(json.message ?? "已更新");
    setAgents((prev) =>
      prev.map((a) => (a.slug === slug ? { ...a, priceUsdt: json.priceUsdt ?? a.priceUsdt } : a))
    );
  };

  if (loading) return <div className="text-slate-400">加载我的 Agent 定价…</div>;

  if (agents.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="py-8 text-center text-slate-400">
          你还没有创建 Agent。
          <Link href="/create" className="ml-2 text-cyan-300 underline">
            去创建
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-300" />
          {formatCreatorShareLabel()}
        </CardDescription>
        <CardTitle className="text-white">我的 Agent 定价</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          定价范围 {AGENT_PRICE_MIN_USDT}～{AGENT_PRICE_MAX_USDT} USDT，0 为免费。
        </p>
        {agents.map((agent) => (
          <div
            key={agent.slug}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium text-white">{agent.name}</div>
              <div className="text-xs text-slate-500">
                /agents/{agent.slug} · {agent.status}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={AGENT_PRICE_MIN_USDT}
                max={AGENT_PRICE_MAX_USDT}
                step="0.01"
                value={drafts[agent.slug] ?? "0"}
                onChange={(e) => setDrafts({ ...drafts, [agent.slug]: e.target.value })}
                className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              />
              <span className="text-sm text-slate-400">USDT</span>
              <Button size="sm" disabled={saving === agent.slug} onClick={() => void savePrice(agent.slug)}>
                {saving === agent.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
              </Button>
            </div>
          </div>
        ))}
        {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
