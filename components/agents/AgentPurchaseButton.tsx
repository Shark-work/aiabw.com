"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getStoredReferralCode } from "@/components/growth/ReferralCapture";

type AgentPurchaseButtonProps = {
  agentSlug: string;
  agentName: string;
  priceUsdt: number;
  isFree: boolean;
  ownsAgent: boolean;
  isLoggedIn: boolean;
};

export function AgentPurchaseButton({
  agentSlug,
  agentName,
  priceUsdt,
  isFree,
  ownsAgent,
  isLoggedIn,
}: AgentPurchaseButtonProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (ownsAgent) {
    return (
      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
        ✓ 你已拥有「{agentName}」，可无限畅聊
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!isLoggedIn) return;

    setLoading(true);
    setMessage(null);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setMessage("请先登录");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/nowpayments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType: "agent",
        agentSlug,
        payCurrency: "usdttrc20",
        referralCode: getStoredReferralCode() ?? undefined,
      }),
    });

    const json = (await res.json()) as {
      ok: boolean;
      free?: boolean;
      checkoutUrl?: string;
      error?: string;
      message?: string;
    };

    if (!res.ok || !json.ok) {
      setMessage(json.error ?? "创建订单失败");
      setLoading(false);
      return;
    }

    if (json.free) {
      setMessage(json.message ?? "已解锁");
      window.location.reload();
      return;
    }

    if (json.checkoutUrl) {
      window.location.href = json.checkoutUrl;
    }

    setLoading(false);
  };

  if (isFree) {
    return (
      <div className="space-y-3">
        <Button className="w-full" onClick={() => void handlePurchase()} disabled={loading || !isLoggedIn}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoggedIn ? "免费解锁此 Agent" : "登录后免费解锁"}
        </Button>
        {!isLoggedIn ? (
          <Button variant="secondary" className="w-full" asChild>
            <Link href="/auth/login">去登录</Link>
          </Button>
        ) : null}
        {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
        永久解锁 <span className="text-white">{agentName}</span>
        <div className="mt-1 text-lg font-semibold text-cyan-200">{priceUsdt} USDT</div>
      </div>
      {!isLoggedIn ? (
        <Button className="w-full" asChild>
          <Link href="/auth/login">登录后购买</Link>
        </Button>
      ) : (
        <Button className="w-full" onClick={() => void handlePurchase()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          购买 Agent · {priceUsdt} USDT
        </Button>
      )}
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
