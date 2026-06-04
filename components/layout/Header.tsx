import Link from "next/link";
import { ChevronDown, Globe, Menu, Sparkles } from "lucide-react";
import { AuthButton } from "@/components/layout/AuthButton";

const navigation = [
  { href: "/agents", label: "AI Agents" },
  { href: "/worlds", label: "世界" },
  { href: "/labs", label: "实验室" },
  { href: "/pro", label: "Pro" },
];

const adminNavigation = [
  { href: "/admin", label: "后台首页" },
  { href: "/admin/settings", label: "站点配置" },
  { href: "/admin/plans", label: "套餐管理" },
  { href: "/admin/transactions", label: "交易管理" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/15 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_30px_rgba(0,245,255,0.15)] transition group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.2em] text-white">
                艾比世界
              </div>
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
                AIABW
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <nav className="flex items-center gap-1 rounded-full border border-red-300/10 bg-red-400/5 p-1">
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-red-100/90 transition hover:bg-red-400/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 md:flex">
              <Globe className="h-4 w-4 text-cyan-300" />
              <span>中文</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>

            <AuthButton />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:hidden">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-full border border-red-300/10 bg-red-400/5 px-3 py-1.5 text-xs text-red-100"
          >
            后台
          </Link>
        </div>
      </div>
    </header>
  );
}

// TODO: Connect language switcher to i18n routing.
