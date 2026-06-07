"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Gift, Loader2, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Invitee = {
  id: string;
  displayLabel: string;
  createdAt: string;
};

type Commission = {
  id: string;
  commissionUsd: number;
  grossUsd: number;
  status: string;
  createdAt: string;
  orderType: string | null;
  planSlug: string | null;
};

type InvitePayload = {
  code: string;
  inviteLink: string;
  stats: {
    inviteCount: number;
    totalCommissionUsd: number;
    availableUsd: number;
    pendingUsd: number;
    totalWithdrawnUsd: number;
    commissionRate: number;
    updatedAt: string | null;
  };
  invitees: Invitee[];
  commissions: Commission[];
};

const MIN_WITHDRAW = 10;

export function InviteDashboard() {
  const [data, setData] = useState<InvitePayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/invite/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean } & InvitePayload) => {
        if (json.ok) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.inviteLink) return;
    await navigator.clipboard.writeText(data.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setMessage(null);
    const res = await fetch("/api/invite/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountUsd: Number(amount),
        payoutAddress: address,
        payCurrency: "usdttrc20",
      }),
    });
    const json = (await res.json()) as { ok: boolean; message?: string; error?: string };
    setWithdrawing(false);
    if (!res.ok || !json.ok) {
      setMessage(json.error ?? "提现失败");
      return;
    }
    setMessage(json.message ?? "已提交");
    setAmount("");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载邀请数据中…
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="py-8 text-center text-slate-400">无法加载邀请数据</CardContent>
      </Card>
    );
  }

  const ratePct = Math.round(data.stats.commissionRate * 100);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-cyan-300" />
            专属邀请链接 · {ratePct}% USDT 佣金
          </CardDescription>
          <CardTitle className="text-white">邀请好友，赚取链上佣金</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            好友通过你的链接注册并付费（Pro 订阅 / Agent 购买）后，你获得订单金额 {ratePct}% 的佣金，计入可提现余额。
          </p>
          <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4">
            <div className="text-xs text-slate-500">邀请码</div>
            <div className="mt-1 font-mono text-lg text-cyan-200">{data.code}</div>
            <div className="mt-3 break-all text-sm text-slate-400">{data.inviteLink}</div>
          </div>
          <Button onClick={() => void copyLink()} className="w-full">
            <Copy className="h-4 w-4" />
            {copied ? "已复制" : "复制邀请链接"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" /> 邀请人数
            </CardDescription>
            <CardTitle className="text-3xl text-white">{data.stats.inviteCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>累计佣金</CardDescription>
            <CardTitle className="text-3xl text-cyan-200">
              {data.stats.totalCommissionUsd.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">USD 等值</CardContent>
        </Card>
        <Card className="border-violet-300/20 bg-violet-400/5">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> 可提现
            </CardDescription>
            <CardTitle className="text-3xl text-violet-200">
              {data.stats.availableUsd.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">USDT 提现</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>已提现</CardDescription>
            <CardTitle className="text-2xl text-white">
              {data.stats.totalWithdrawnUsd.toFixed(2)}
            </CardTitle>
          </CardHeader>
          {data.stats.pendingUsd > 0 ? (
            <CardContent className="text-xs text-amber-200">处理中 {data.stats.pendingUsd.toFixed(2)} USD</CardContent>
          ) : null}
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">提现邀请佣金</CardTitle>
          <CardDescription>最低 {MIN_WITHDRAW} USDT · TRC20</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`金额（≥${MIN_WITHDRAW}）`}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-300/40"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="USDT TRC20 地址"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-300/40 sm:col-span-1"
          />
          <Button
            className="sm:col-span-2"
            disabled={withdrawing || data.stats.availableUsd < MIN_WITHDRAW}
            onClick={() => void handleWithdraw()}
          >
            {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            申请提现
          </Button>
          {message ? <p className="text-sm text-cyan-200 sm:col-span-2">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">邀请记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.invitees.length === 0 ? (
              <p className="text-sm text-slate-500">还没有好友通过你的链接注册。</p>
            ) : (
              data.invitees.map((row) => (
                <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="text-white">{row.displayLabel}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(row.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">佣金明细</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.commissions.length === 0 ? (
              <p className="text-sm text-slate-500">好友付费后佣金将显示在这里。</p>
            ) : (
              data.commissions.map((row) => (
                <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex justify-between text-white">
                    <span>+{row.commissionUsd.toFixed(2)} USD</span>
                    <span className="text-emerald-300">{row.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    订单 {row.grossUsd.toFixed(2)} USD · {row.orderType ?? "—"}
                    {row.planSlug ? ` · ${row.planSlug}` : ""}
                  </div>
                  <div className="text-xs text-slate-600">
                    {new Date(row.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500">
        数据在支付 Webhook 后实时结算；钱包余额每次打开本页自动重算。
        <Link href="/account" className="ml-1 text-cyan-300 underline">
          返回个人中心
        </Link>
      </p>
    </div>
  );
}
