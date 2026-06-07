"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPagination } from "@/components/ui/list-pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";

type AgentRow = {
  id: string;
  slug: string;
  name: string;
  creator: string;
  category: string;
  priceUsdt: unknown;
  status: string;
  moderationStatus: string;
  isFeatured: boolean;
  sales: number;
  createdAt: string;
};

type Props = {
  initialRows: AgentRow[];
  total: number;
  page: number;
  query: Record<string, string | undefined>;
};

export function AdminAgentsPanel({ initialRows, total, page, query }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/admin/agents?${params.toString()}`);
    },
    [router, sp]
  );

  const patch = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "失败");
      toast.success("操作成功");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <Input placeholder="搜索名称/slug…" defaultValue={query.q ?? ""} className="max-w-xs" onKeyDown={(e) => { if (e.key === "Enter") applyFilter("q", (e.target as HTMLInputElement).value); }} />
        <Select defaultValue={query.status ?? ""} onChange={(e) => applyFilter("status", e.target.value)}>
          <option value="">全部状态</option>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </Select>
        <Button size="sm" variant="secondary" disabled={loading || !selected.size} onClick={() => patch({ agentIds: [...selected], action: "publish" })}>批量上架</Button>
        <Button size="sm" variant="secondary" disabled={loading || !selected.size} onClick={() => patch({ agentIds: [...selected], action: "unpublish" })}>批量下架</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>创作者</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>销量</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.map((a) => (
            <TableRow key={a.id}>
              <TableCell><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} /></TableCell>
              <TableCell>
                <Link href={`/agents/${a.slug}`} className="font-medium text-cyan-200 hover:underline">{a.name}</Link>
                {a.isFeatured ? <Badge variant="violet" className="ml-2">推荐</Badge> : null}
              </TableCell>
              <TableCell>{a.creator}</TableCell>
              <TableCell>{String(a.priceUsdt)} USDT</TableCell>
              <TableCell>{a.sales}</TableCell>
              <TableCell><Badge variant={a.status === "active" ? "success" : "warning"}>{a.status}</Badge></TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="secondary" disabled={loading} onClick={() => patch({ agentId: a.id, action: "feature" })}>推荐</Button>
                  <Button size="sm" variant="secondary" disabled={loading} onClick={() => patch({ agentId: a.id, action: "unpublish" })}>下架</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ListPagination basePath="/admin/agents" page={page} totalPages={totalPages} query={query} />
    </div>
  );
}
