"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListPagination } from "@/components/ui/list-pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";

type SubRow = {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  planSlug: string;
  status: string;
  periodEnd: string | null;
  createdAt: string;
};

type Props = {
  initialRows: SubRow[];
  total: number;
  page: number;
};

export function AdminSubscriptionsPanel({ initialRows, total, page }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const patch = async (body: Record<string, unknown>) => {
    setLoading(String(body.subscriptionId));
    try {
      const res = await fetch("/api/admin/subscriptions", {
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
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>套餐</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>到期</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.userName}</TableCell>
              <TableCell>{s.planName}</TableCell>
              <TableCell><Badge variant={s.status === "active" ? "success" : "default"}>{s.status}</Badge></TableCell>
              <TableCell className="text-xs text-slate-400">{s.periodEnd?.slice(0, 10) ?? "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => patch({ subscriptionId: s.id, action: "extend", extendMonths: 1 })}>+1月</Button>
                  <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => patch({ subscriptionId: s.id, action: "cancel" })}>取消</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ListPagination basePath="/admin/subscriptions" page={page} totalPages={totalPages} />
    </div>
  );
}
