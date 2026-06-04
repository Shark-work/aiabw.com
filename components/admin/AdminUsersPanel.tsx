"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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

type UserRow = {
  userId: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  lastSignIn: string | null;
  subscriptionStatus: string;
};

type AdminUsersPanelProps = {
  initialRows: UserRow[];
  total: number;
  page: number;
  query: Record<string, string | undefined>;
};

async function apiPatch(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "操作失败");
}

export function AdminUsersPanel({ initialRows, total, page, query }: AdminUsersPanelProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, sp]
  );

  const act = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    setLoading(userId + action);
    try {
      await apiPatch({ userId, action, ...extra });
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
      <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <Input
          placeholder="搜索用户名…"
          defaultValue={query.q ?? ""}
          className="max-w-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilter("q", (e.target as HTMLInputElement).value);
          }}
        />
        <Select defaultValue={query.role ?? ""} onChange={(e) => applyFilter("role", e.target.value)}>
          <option value="">全部角色</option>
          <option value="user">user</option>
          <option value="creator">creator</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </Select>
        <Select defaultValue={query.sub ?? ""} onChange={(e) => applyFilter("sub", e.target.value)}>
          <option value="">全部订阅</option>
          <option value="active">Pro 活跃</option>
          <option value="none">无订阅</option>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>订阅</TableHead>
            <TableHead>注册</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRows.map((u) => (
            <TableRow key={u.userId}>
              <TableCell>
                <div className="font-medium text-white">{u.displayName ?? u.username ?? "—"}</div>
                <div className="text-xs text-slate-500">{u.userId.slice(0, 8)}…</div>
              </TableCell>
              <TableCell className="text-slate-400">{u.email ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={u.role === "admin" ? "violet" : "default"}>{u.role}</Badge>
                {u.banned ? <Badge variant="danger" className="ml-1">禁用</Badge> : null}
              </TableCell>
              <TableCell>
                <Badge variant={u.subscriptionStatus === "active" ? "success" : "default"}>
                  {u.subscriptionStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-400">{u.createdAt.slice(0, 10)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => act(u.userId, "extend_subscription", { planSlug: "pro_monthly" })}>
                    +Pro
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => act(u.userId, "set_banned", { banned: !u.banned })}>
                    {u.banned ? "启用" : "禁用"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ListPagination basePath="/admin/users" page={page} totalPages={totalPages} query={query} />
    </div>
  );
}
