"use client";

import Link from "next/link";
import { useMemo } from "react";

export function AdminShell({ email, active, children }: { email: string; active: "topics" | "schedule"; children: React.ReactNode }) {
  const hrefBase = useMemo(() => `?email=${encodeURIComponent(email)}`, [email]);
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-white/10 bg-white/5 p-6 md:w-64 md:border-b-0 md:border-r">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">DailyQuest</p>
            <h1 className="mt-2 text-xl font-semibold">后台管理</h1>
            <p className="mt-2 break-all text-xs text-white/50">{email}</p>
          </div>
          <nav className="space-y-2 text-sm">
            <Link href={`/admin/topics${hrefBase}`} className={`block rounded-xl px-4 py-3 transition ${active === "topics" ? "bg-cyan-400/15 text-cyan-100" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>题材管理</Link>
            <Link href={`/admin/schedule${hrefBase}`} className={`block rounded-xl px-4 py-3 transition ${active === "schedule" ? "bg-cyan-400/15 text-cyan-100" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>排期管理</Link>
          </nav>
        </aside>
        <section className="flex-1 p-6">{children}</section>
      </div>
    </div>
  );
}
