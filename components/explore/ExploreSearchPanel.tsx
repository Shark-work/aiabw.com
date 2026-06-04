"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Dice5, Heart, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPLORE_FEATURED_FILTERS, type ExploreFilterId } from "@/lib/explore-filters";
import type { AgentListItem } from "@/lib/agents";
import { getAgentPriceUsdt } from "@/lib/products";

type AgentItem = AgentListItem;

type ExploreSearchProps = {
  initialAgents: AgentItem[];
  categories: Array<{ slug: string; name: string }>;
};

const DEBOUNCE_MS = 280;

export function ExploreSearchPanel({ initialAgents, categories }: ExploreSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [selectedFilters, setSelectedFilters] = useState<ExploreFilterId[]>(() => {
    const raw = searchParams.get("filter") ?? "";
    return raw
      .split(",")
      .filter((s): s is ExploreFilterId => EXPLORE_FEATURED_FILTERS.some((f) => f.id === s)) as ExploreFilterId[];
  });
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [agents, setAgents] = useState(initialAgents);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const hasQuery = useMemo(
    () => Boolean(q.trim() || selectedFilters.length || category),
    [q, selectedFilters, category]
  );

  const syncUrl = useCallback(
    (nextQ: string, filters: ExploreFilterId[], cat: string) => {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (filters.length) params.set("filter", filters.join(","));
      if (cat) params.set("category", cat);
      const qs = params.toString();
      router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
    },
    [router]
  );

  const runSearch = useCallback(async () => {
    if (!hasQuery) {
      setAgents(initialAgents);
      setEmpty(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (selectedFilters.length) params.set("filter", selectedFilters.join(","));
    if (category) params.set("category", category);
    params.set("limit", "48");

    try {
      const res = await fetch(`/api/agents/search?${params.toString()}`);
      const json = (await res.json()) as { agents?: AgentItem[] };
      const list = json.agents ?? [];
      setAgents(list);
      setEmpty(list.length === 0);
    } catch {
      setAgents([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [q, selectedFilters, category, hasQuery, initialAgents]);

  useEffect(() => {
    syncUrl(q, selectedFilters, category);
    const timer = setTimeout(() => void runSearch(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, selectedFilters, category, runSearch, syncUrl]);

  const toggleFilter = (id: ExploreFilterId) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const clearAll = () => {
    setQ("");
    setSelectedFilters([]);
    setCategory("");
    setAgents(initialAgents);
    setEmpty(false);
  };

  const handleRandom = () => {
    const pool = agents.length ? agents : initialAgents;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/agents/${pick.slug}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/80" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索 Agent 名称、简介、slug…"
            aria-label="搜索 Agent"
            className="w-full rounded-2xl border border-cyan-300/15 bg-black/25 py-3.5 pl-11 pr-10 text-white shadow-[0_0_24px_rgba(34,211,238,0.08)] outline-none transition focus:border-cyan-300/45 focus:ring-1 focus:ring-cyan-300/20"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              aria-label="清空搜索"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none focus:border-cyan-300/40"
          aria-label="垂类筛选"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button variant="outline" className="shrink-0" onClick={handleRandom}>
          <Dice5 className="h-4 w-4" /> 随机发现
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">标签</span>
        {EXPLORE_FEATURED_FILTERS.map((f) => {
          const active = selectedFilters.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFilter(f.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-violet-300/50 bg-violet-400/20 text-violet-100 shadow-[0_0_16px_rgba(167,139,250,0.25)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        {hasQuery ? (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs text-slate-500 underline hover:text-cyan-200"
          >
            清除筛选
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="text-sm text-cyan-200/80">搜索中（pg_trgm + 平台缓存）…</div>
      ) : null}
      {!loading && empty ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
          没有匹配的 Agent，试试其他关键词或标签。
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => {
          const meta = (agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
            ? agent.metadata
            : {}) as Record<string, unknown>;
          const price = getAgentPriceUsdt(meta);
          const isFree = meta.free === true || price <= 0;
          const tag = agent.category?.name ?? "Agent";
          const accent = (meta.accent as string | undefined) ?? "from-cyan-400/15 to-violet-500/10";

          return (
            <Card
              key={agent.slug}
              className={`border-white/10 bg-gradient-to-br ${accent} bg-white/5 transition hover:border-cyan-300/25`}
            >
              <CardHeader>
                <CardDescription>{tag}</CardDescription>
                <CardTitle className="text-white">{agent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm leading-6 text-slate-300">{agent.description}</p>
                <div className="mt-2 text-xs text-cyan-200">{isFree ? "免费" : `${price} USDT`}</div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/agents/${agent.slug}`}>
                      详情 <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/agents/${agent.slug}#chat`}>
                      <Heart className="h-4 w-4" /> 试用
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
