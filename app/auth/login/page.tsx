"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, Sparkles } from "lucide-react";
import { Button, GA4_EVENTS } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { trackEvent } from "@/lib/analytics";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("magic");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      trackEvent(GA4_EVENTS.LOGIN, { method: "password" });
      router.push("/account");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/account`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      trackEvent(GA4_EVENTS.LOGIN, { method: "magic_link" });
      setMessage("登录邮件已发送，请查看邮箱点击链接完成登录。请确保 Supabase Redirect URL 已配置到正式域名。");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6 px-4 py-8 lg:px-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Sparkles className="h-4 w-4" />
          Welcome back
        </div>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">登录后解锁收藏、试用与订阅</h1>
        <p className="max-w-xl text-slate-300">
          使用邮箱登录，完成验证后即可创建支付订单、开通会员，并同步你的个人宇宙资料。
        </p>
        <div className="text-sm text-slate-400">
          还没有账号？先用邮箱注册或使用魔法链接。然后再去 <Link className="text-cyan-300 hover:underline" href="/pro">订阅页</Link>。
        </div>
      </section>

      <section className="px-4 lg:px-0">
        <Card className="border-white/10 bg-white/5 shadow-2xl shadow-cyan-500/10">
          <CardHeader>
            <CardDescription>AIABW 登录</CardDescription>
            <CardTitle className="text-white">进入你的账号</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm text-slate-200">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              {mode === "password" ? (
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm text-slate-200">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <MailCheck className="h-4 w-4" />
                  {loading ? "发送中..." : mode === "password" ? "邮箱密码登录" : "发送魔法链接"}
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode((m) => (m === "magic" ? "password" : "magic"))}>
                  切换到{mode === "magic" ? "密码登录" : "魔法链接"}
                </Button>
              </div>

              {message ? <p className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</p> : null}
              {error ? <p className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p> : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
