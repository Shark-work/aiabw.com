"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const paymentMethods = [
  { id: "usdttrc20", label: "USDT (TRC20)" },
  { id: "usdterc20", label: "USDT (ERC20)" },
  { id: "usdtbep20", label: "USDT (BEP20)" },
  { id: "usdcerc20", label: "USDC (ERC20)" },
] as const;

const plans = {
  creator: { slug: "creator", name: "Creator Plan", price: "$19", priceAmount: 19, interval: "Monthly" },
  universe: { slug: "universe", name: "Universe Plan", price: "$49", priceAmount: 49, interval: "Monthly" },
  explorer: { slug: "explorer", name: "Explorer Plan", price: "$0", priceAmount: 0, interval: "Free" },
} as const;

export default function CheckoutClientPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const initialPlan = (searchParams.get("plan") ?? "creator") as keyof typeof plans;
  const [planSlug, setPlanSlug] = useState<keyof typeof plans>(initialPlan in plans ? initialPlan : "creator");
  const [payCurrency, setPayCurrency] = useState<(typeof paymentMethods)[number]["id"]>("usdttrc20");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(data.user));
    })();
  }, [supabase]);

  useEffect(() => {
    const qPlan = (searchParams.get("plan") ?? "creator") as keyof typeof plans;
    if (qPlan in plans) setPlanSlug(qPlan);
  }, [searchParams]);

  const selectedPlan = plans[planSlug];

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    setCheckoutUrl(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setLoading(false);
      setError("请先登录后再创建支付订单。点击右上角登录后再回来。");
      return;
    }

    const res = await fetch("/api/nowpayments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug }),
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <WalletCards className="h-4 w-4" />
              Checkout
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">解锁宇宙门票</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              现在已经接入真实订单创建流程，支持选择套餐与支付方式，并回写到 `transactions` 与 `subscriptions`。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!isLoggedIn ? (
              <Button asChild>
                <Link href="/auth/login">先登录</Link>
              </Button>
            ) : null}
            <Button variant="secondary" asChild>
              <Link href="/pro">
                返回方案页 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>选择套餐</CardDescription>
            <CardTitle className="text-white">选择你要购买的会员方案</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(plans).map((plan) => {
              const active = plan.slug === planSlug;
              return (
                <button
                  key={plan.slug}
                  type="button"
                  onClick={() => setPlanSlug(plan.slug)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-medium text-white">{plan.name}</div>
                      <div className="text-xs text-slate-400">{plan.interval}</div>
                    </div>
                    <div className="text-lg font-semibold text-white">{plan.price}</div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>支付方式</CardDescription>
            <CardTitle className="text-white">选择你喜欢的链上支付</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const active = payCurrency === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPayCurrency(method.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-200">{method.label}</span>
                    {active ? <span className="text-xs text-cyan-200">已选择</span> : null}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>订单摘要</CardDescription>
            <CardTitle className="text-white">{selectedPlan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>订阅周期</span>
              <span className="text-white">{selectedPlan.interval}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>价格</span>
              <span className="text-white">{selectedPlan.price}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>币种</span>
              <span className="text-white">{payCurrency}</span>
            </div>
            <Button className="w-full" onClick={handleCreateOrder} disabled={loading}>
              {loading ? "创建中..." : "立即创建支付订单"}
            </Button>
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-50">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <p>支付完成后会自动更新订阅状态。Webhook 已加入签名校验逻辑。</p>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {checkoutUrl ? <p className="break-all text-xs text-cyan-200">{checkoutUrl}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>快速入口</CardDescription>
            <CardTitle className="text-white">如果还没登录，先登录再回来</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            {!isLoggedIn ? (
              <>
                <p>当前未登录，所以无法创建订单。先登录后再回来创建支付单。</p>
                <Button className="w-full" asChild>
                  <Link href="/auth/login">去登录</Link>
                </Button>
              </>
            ) : (
              <p>你已登录，可以直接创建支付订单。</p>
            )}
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/pro">返回订阅页</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
