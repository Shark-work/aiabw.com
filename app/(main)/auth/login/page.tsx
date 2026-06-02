"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    setLoading(false);
    setMessage(error ? error.message : "登录链接已发送，请查看邮箱。");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl border-cyan-300/20 bg-slate-950/70">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardDescription>进入 AIABW 平行世界</CardDescription>
          <CardTitle className="text-white">使用邮箱魔法链接登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">邮箱地址</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Mail className="h-4 w-4 text-cyan-300" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "发送中..." : "发送登录链接"}
            </Button>
          </form>

          {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
