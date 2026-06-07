"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Bot, Link2, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREATOR_SHARE_RATE, MIN_CREATOR_WITHDRAWAL_USDT, PLATFORM_SHARE_RATE } from "@/lib/growth";
import { formatCreatorShareLabel } from "@/lib/creator-pricing";
import { maskTronAddress } from "@/lib/tron-address";

type WalletData = {
  wallet: {
    available_usd: number;
    pending_usd: number;
    total_earned_usd: number;
    total_withdrawn_usd: number;
  };
  tronAddress: string | null;
  tronAddressMasked: string | null;
  hasBoundTron: boolean;
  recentEarnings: Array<{ creator_usd: number; created_at: string; agent_id: string | null }>;
  recentWithdrawals: Array<{
    id: string;
    amount_usd: number;
    status: string;
    created_at: string;
    payout_address: string;
    provider_payout_id: string | null;
  }>;
  minWithdrawal: number;
  creatorShareRate: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  processing: "打款中",
  completed: "已到账",
  failed: "失败",
};

export function CreatorWalletPanel() {
  const [data, setData] = useState<WalletData | null>(null);
  const [tronDraft, setTronDraft] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [binding, setBinding] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    fetch("/api/creator/wallet", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean } & WalletData) => {
        if (json.ok) {
          setData(json);
          if (json.tronAddress) setTronDraft(json.tronAddress);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleBind = async () => {
    setBinding(true);
    setMessage(null);
    const res = await fetch("/api/creator/wallet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tronAddress: tronDraft }),
    });
    const json = (await res.json()) as { ok: boolean; message?: string; error?: string };
    setMessage(json.ok ? (json.message ?? "已绑定") : (json.error ?? "绑定失败"));
    setBinding(false);
    if (json.ok) load();
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setMessage(null);
    const res = await fetch("/api/creator/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUsd: Number(amount) }),
    });
    const json = (await res.json()) as { ok: boolean; message?: string; error?: string };
    setMessage(json.ok ? (json.message ?? "已提交") : (json.error ?? "失败"));
    setWithdrawing(false);
    if (json.ok) {
      setAmount("");
      load();
    }
  };

  if (loading) return <div className="text-slate-400">加载创作者钱包…</div>;

  const wallet = data?.wallet;
  const sharePct = Math.round((data?.creatorShareRate ?? CREATOR_SHARE_RATE) * 100);
  const platformPct = Math.round(PLATFORM_SHARE_RATE * 100);
  const minWd = data?.minWithdrawal ?? MIN_CREATOR_WITHDRAWAL_USDT;
  const canWithdraw = data?.hasBoundTron && Number(wallet?.available_usd ?? 0) >= minWd;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["可提现", wallet?.available_usd ?? 0],
          ["提现中", wallet?.pending_usd ?? 0],
          ["累计收益 (70%)", wallet?.total_earned_usd ?? 0],
          ["已提现", wallet?.total_withdrawn_usd ?? 0],
        ].map(([label, val]) => (
          <Card key={label as string} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>{label as string} (USDT)</CardDescription>
              <CardTitle className="text-2xl text-white">{Number(val).toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-cyan-300/20 bg-cyan-400/5">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-cyan-300" />
            TRON 钱包 · USDT-TRC20
          </CardDescription>
          <CardTitle className="text-white">
            {data?.hasBoundTron
              ? `已绑定 ${data.tronAddressMasked ?? maskTronAddress(data.tronAddress!)}`
              : "绑定收款地址后才能提现"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            填写 TRON 主网地址（以 T 开头，34 位）。提现将通过 NOWPayments Payout 自动打入该地址。
          </p>
          <input
            value={tronDraft}
            onChange={(e) => setTronDraft(e.target.value)}
            placeholder="Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-300/40"
          />
          <Button className="w-full" variant="secondary" disabled={binding} onClick={() => void handleBind()}>
            {binding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {data?.hasBoundTron ? "更新 TRON 地址" : "绑定 TRON 钱包"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-300" />
            NOWPayments 自动打款
          </CardDescription>
          <CardTitle className="text-white">
            创作者 {sharePct}% · 平台 {platformPct}% · 满 {minWd} USDT 起提
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">{formatCreatorShareLabel()}。提交后系统自动调用 Payout API 打款至已绑定地址。</p>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`提现金额（≥ ${minWd} USDT）`}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
          {!data?.hasBoundTron ? (
            <p className="text-sm text-amber-200">请先绑定 TRON 地址</p>
          ) : null}
          <Button
            className="w-full"
            disabled={withdrawing || !canWithdraw}
            onClick={() => void handleWithdraw()}
          >
            {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
            申请提现（自动打款）
          </Button>
          {!canWithdraw && data?.hasBoundTron ? (
            <p className="text-xs text-slate-500">可提现余额需 ≥ {minWd} USDT（当前 {Number(wallet?.available_usd ?? 0).toFixed(2)}）</p>
          ) : null}
          {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
          <Button variant="secondary" size="sm" asChild>
            <Link href="/creator/earnings">查看完整收益与提现记录</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              最近销售分成
            </CardDescription>
            <CardTitle className="text-lg text-white">收益记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recentEarnings ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">暂无销售记录</p>
            ) : (
              data?.recentEarnings.map((e, i) => (
                <div
                  key={`${e.created_at}-${i}`}
                  className="flex justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="text-slate-400">{new Date(e.created_at).toLocaleString("zh-CN")}</span>
                  <span className="text-cyan-200">+{Number(e.creator_usd).toFixed(2)} USDT</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              提现记录
            </CardDescription>
            <CardTitle className="text-lg text-white">最近提现</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recentWithdrawals ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">暂无提现记录</p>
            ) : (
              data?.recentWithdrawals.map((w) => (
                <div key={w.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <div className="flex justify-between text-white">
                    <span>{Number(w.amount_usd).toFixed(2)} USDT</span>
                    <span className="text-slate-400">{STATUS_LABEL[w.status] ?? w.status}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{maskTronAddress(w.payout_address)}</span>
                    <span>{new Date(w.created_at).toLocaleString("zh-CN")}</span>
                  </div>
                  {w.provider_payout_id ? (
                    <div className="mt-1 text-xs text-slate-600">Payout #{w.provider_payout_id}</div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
