"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AgentRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  created_at: string;
  status: string;
  moderation_status?: string;
};

type Props = {
  pending: AgentRow[];
  rejected: AgentRow[];
};

export function AdminModerationPanel({ pending, rejected }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "rejected">("pending");
  const rows = tab === "pending" ? pending : rejected;

  const patch = async (agentId: string, action: string) => {
    setLoading(agentId + action);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, action, note: action === "reject" ? note : undefined }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "失败");
      toast.success(action === "approve" ? "已通过审核" : "已拒绝");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "pending" ? "default" : "secondary"} onClick={() => setTab("pending")}>待审核 ({pending.length})</Button>
        <Button size="sm" variant={tab === "rejected" ? "default" : "secondary"} onClick={() => setTab("rejected")}>已拒绝 ({rejected.length})</Button>
      </div>

      {tab === "pending" ? (
        <Input placeholder="拒绝理由（拒绝时填写）" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-md" />
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>简介</TableHead>
            <TableHead>提交时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link href={`/agents/${a.slug}`} className="font-medium text-cyan-200 hover:underline">{a.name}</Link>
                <Badge className="ml-2">{a.status}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate text-slate-400">{a.description ?? "—"}</TableCell>
              <TableCell className="text-xs text-slate-400">{a.created_at.slice(0, 10)}</TableCell>
              <TableCell>
                {tab === "pending" ? (
                  <div className="flex gap-1">
                    <Button size="sm" disabled={!!loading} onClick={() => patch(a.id, "approve")}>通过</Button>
                    <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => patch(a.id, "reject")}>拒绝</Button>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
