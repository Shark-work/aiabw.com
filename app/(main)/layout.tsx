import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { GrowthProviders } from "@/components/growth/GrowthProviders";
import { PageViewTracker } from "@/components/layout/PageViewTracker";
import { ProPromoStrip } from "@/components/layout/ProPromoStrip";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,245,255,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      <GrowthProviders />
      <PageViewTracker />
      <Header />
      <ProPromoStrip />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-50">
          如果你发现页面异常，先打开 <Link href="/diagnostics" className="underline">/diagnostics</Link>，它会帮你自动判断是路由、API、登录、环境变量还是数据库问题。
        </div>
      </div>
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
