"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PRO_PLANS, type ProPlanSlug } from "@/lib/products";
import { PRO_BENEFITS } from "@/lib/pro-subscription";
import { getStoredReferralCode } from "@/components/growth/ReferralCapture";

const paymentMethods = [
  { id: "usdttrc20", label: "USDT (TRC20)" },
  { id: "usdterc20", label: "USDT (ERC20)" },
  { id: "usdtbep20", label: "USDT (BEP20)" },
  { id: "usdcerc20", label: "USDC (ERC20)" },
] as const;

const PRO_SLUGS: ProPlanSlug[] = ["pro_monthly", "pro_yearly"];

function resolvePlanFromQuery(raw: string | null): ProPlanSlug {
  const s = (raw ?? "pro").toLowerCase();
  if (s === "pro" || s === "monthly" || s === "pro_monthly") return "pro_monthly";
  if (s === "yearly" || s === "annual" || s === "pro_yearly") return "pro_yearly";
  if (PRO_SLUGS.includes(s as ProPlanSlug)) return s as ProPlanSlug;
  return "pro_monthly";
}

export default function CheckoutClientPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [planSlug, setPlanSlug] = useState<ProPlanSlug>(() => resolvePlanFromQuery(searchParams.get("plan")));
  const [payCurrency, setPayCurrency] = useState<(typeof paymentMethods)[number]["id"]>("usdttrc20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const selectedPlan = PRO_PLANS[planSlug];
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(data.user));
    })();
  }, [supabase]);

  useEffect(() => {
    setPlanSlug(resolvePlanFromQuery(searchParams.get("plan")));
  }, [searchParams]);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setLoading(false);
      setError("请先登录后再创建支付订单。");
      return;
    }

    const res = await fetch("/api/nowpayments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType: "subscription",
        planSlug,
        payCurrency,
        referralCode: getStoredReferralCode() ?? undefined,
      }),
    });

    const json = (await res.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error ?? "创建支付订单失败");
      setLoading(false);
      return;
    }

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
              Pro 结账
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">订阅 AIABW Pro</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              通过 NOWPayments 支付 USDT/USDC，Webhook 确认后自动激活订阅与 Pro 权益。
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

      {paymentStatus === "cancelled" ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          支付已取消，可重新选择套餐并创建订单。
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Pro 套餐</CardDescription>
            <CardTitle className="text-white">选择订阅周期</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PRO_SLUGS.map((slug) => {
              const plan = PRO_PLANS[slug];
              const active = slug === planSlug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setPlanSlug(slug);
                    router.replace(`/checkout?plan=${slug}`, { scroll: false });
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-medium text-white">{plan.name}</div>
                      <div className="text-xs text-slate-400">
                        {slug === "pro_yearly" ? "12 个月" : "1 个月"}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-cyan-200">{plan.displayPrice}</div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>支付方式</CardDescription>
            <CardTitle className="text-white">链上支付</CardTitle>
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
              <span>价格</span>
              <span className="text-lg font-semibold text-white">{selectedPlan.displayPrice}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <span>支付币种</span>
              <span className="text-white">{payCurrency}</span>
            </div>
            <ul className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              {PRO_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-slate-300">
                  <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />
                  {b}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => void handleCreateOrder()} disabled={loading || !isLoggedIn}>
              {loading ? "创建订单中..." : `支付 ${selectedPlan.priceAmount} USDT`}
            </Button>
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-50">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>支付成功后订阅状态与到期时间将同步至账户页，Pro 权益即时生效。</p>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>提示</CardDescription>
            <CardTitle className="text-white">订阅说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>路径支持 <code className="text-cyan-200">/checkout?plan=pro</code>（默认月度）或 yearly 年度套餐。</p>
            {!isLoggedIn ? (
              <>
                <p>请先登录再创建订单。</p>
                <Button className="w-full" asChild>
                  <Link href="/auth/login">去登录</Link>
                </Button>
              </>
            ) : (
              <p className="text-emerald-200">已登录，可以发起支付。</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
