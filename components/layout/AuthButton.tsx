"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserCircle2, LogIn, Loader2, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  if (loading) {
    return (
      <button className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 px-3 py-2 text-sm text-white">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
        <span className="hidden sm:inline">载入中</span>
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-full border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 px-3 py-2 text-sm text-white shadow-[0_0_30px_rgba(114,9,183,0.08)] transition hover:border-cyan-300/40 hover:from-cyan-400/15 hover:to-violet-500/15"
        >
          <UserCircle2 className="h-5 w-5 text-cyan-300" />
          <span className="hidden sm:inline">个人中心</span>
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 text-cyan-300" />
          <span className="hidden sm:inline">{signingOut ? "退出中" : "退出"}</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="flex items-center gap-3 rounded-full border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 px-3 py-2 text-sm text-white shadow-[0_0_30px_rgba(114,9,183,0.08)] transition hover:border-cyan-300/40 hover:from-cyan-400/15 hover:to-violet-500/15"
    >
      <LogIn className="h-5 w-5 text-cyan-300" />
      <span className="hidden sm:inline">登录 / 注册</span>
    </Link>
  );
}
