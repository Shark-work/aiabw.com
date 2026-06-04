"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

type Summary = {
  creator: { available: number; earned: number; withdrawn: number };
  referral: { available: number; earned: number; withdrawn: number };
};

type WithdrawalRow = {
  id: string;
  user_id: string;
  amount_usd: number;
  status: string;
  created_at: string;
  walletType: "creator" | "referral";
};

type Props = {
  summary: Summary;
  withdrawals: WithdrawalRow[];
};

export function AdminCommissionsPanel({ summary, withdrawals }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [tab, setTab] = useState("withdrawals");

  const review = async (withdrawalId: string, action: string, walletType: "creator" | "referral") => {
    setLoading(withdrawalId + action);
    try {
      const res = await fetch("/api/admin/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, walletType }),
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
    <Tabs>
      <TabsList>
        <TabsTrigger active={tab === "summary"} onClick={() => setTab("summary")}>统计</TabsTrigger>
        <TabsTrigger active={tab === "withdrawals"} onClick={() => setTab("withdrawals")}>提现申请</TabsTrigger>
      </TabsList>

      <TabsContent>
        {tab === "summary" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <AdminStatCard label="创作者总收益" value={`$${summary.creator.earned.toFixed(2)}`} hint={`待提现 $${summary.creator.available.toFixed(2)}`} accent="cyan" />
            <AdminStatCard label="邀请总佣金" value={`$${summary.referral.earned.toFixed(2)}`} hint={`待提现 $${summary.referral.available.toFixed(2)}`} accent="violet" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.walletType === "creator" ? "创作者" : "邀请"}</TableCell>
                  <TableCell>${w.amount_usd}</TableCell>
                  <TableCell><Badge variant={w.status === "pending" ? "warning" : w.status === "paid" ? "success" : "default"}>{w.status}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-400">{w.created_at.slice(0, 10)}</TableCell>
                  <TableCell>
                    {w.status === "pending" ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => review(w.id, "approve", w.walletType)}>通过</Button>
                        <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => review(w.id, "paid", w.walletType)}>已打款</Button>
                        <Button size="sm" variant="secondary" disabled={!!loading} onClick={() => review(w.id, "reject", w.walletType)}>拒绝</Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}
