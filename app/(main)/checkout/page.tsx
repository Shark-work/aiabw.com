"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const paymentMethods = ["USDT (TRC20)", "USDC (ERC20)", "USDT (BEP20)"];

export default function CheckoutPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    setCheckoutUrl(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setLoading(false);
      setError("请先登录后再创建支付订单。");
      return;
    }

    const res = await fetch("/api/nowpayments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: "creator", userId: user.id }),
    });

    const json = (await res.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error ?? "创建支付订单失败");
      setLoading(false);
      return;
    }

    setCheckoutUrl(json.checkoutUrl ?? null);
    setLoading(false);
    if (json.checkoutUrl) window.location.href = json.checkoutUrl;
  };

  return (
    <div className="space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <WalletCards className="h-4 w-4" />
          Checkout
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">解锁宇宙门票</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          现在已经接入真实订单创建流程，后续可对接 NOWPayments 支付页并回写到 `transactions` 与 `subscriptions`。
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>支付方式</CardDescription>
            <CardTitle className="text-white">选择你喜欢的链上支付</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                {method}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>订单摘要</CardDescription>
            <CardTitle className="text-white">Creator Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>订阅周期</span>
              <span className="text-white">Monthly</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>价格</span>
              <span className="text-white">$19</span>
            </div>
            <Button className="w-full" onClick={handleCreateOrder} disabled={loading}>
              {loading ? "创建中..." : "立即创建支付订单"}
            </Button>
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/pro">
                返回方案页 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-50">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <p>支付完成后会自动更新订阅状态。Webhook 已加入签名校验逻辑。</p>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {checkoutUrl ? <p className="text-xs text-cyan-200 break-all">{checkoutUrl}</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
