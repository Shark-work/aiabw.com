"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListPagination } from "@/components/ui/list-pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";

type OrderRow = {
  id: string;
  orderId: string;
  userId: string;
  productType: string;
  planSlug: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type Props = {
  initialRows: OrderRow[];
  total: number;
  page: number;
  query: Record<string, string | undefined>;
};

export function AdminOrdersPanel({ initialRows, total, page, query }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const fulfill = async (orderId: string) => {
    setLoading(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "manual_fulfill" }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "补单失败");
      toast.success("手动补单成功");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "补单失败");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <Input
          placeholder="搜索订单号…"
          defaultValue={query.q ?? ""}
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const params = new URLSearchParams(sp.toString());
              params.set("q", (e.target as HTMLInputElement).value);
              params.delete("page");
              router.push(`/admin/orders?${params.toString()}`);
            }
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单号</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs text-cyan-100">{o.orderId}</TableCell>
              <TableCell>{o.productType} · {o.planSlug}</TableCell>
              <TableCell>{o.amount} {o.currency}</TableCell>
              <TableCell><Badge variant={o.status === "finished" ? "success" : "warning"}>{o.status}</Badge></TableCell>
              <TableCell className="text-xs text-slate-400">{o.createdAt.slice(0, 16).replace("T", " ")}</TableCell>
              <TableCell>
                {o.status !== "finished" && o.status !== "confirmed" ? (
                  <Button size="sm" variant="secondary" disabled={loading === o.orderId} onClick={() => fulfill(o.orderId)}>
                    手动补单
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ListPagination basePath="/admin/orders" page={page} totalPages={totalPages} query={query} />
    </div>
  );
}
