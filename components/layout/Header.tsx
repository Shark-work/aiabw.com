import Link from "next/link";
import { ChevronDown, Globe, Menu, Sparkles } from "lucide-react";
import { AuthButton } from "@/components/layout/AuthButton";

const navigation = [
  { href: "/agents", label: "AI Agents" },
  { href: "/worlds", label: "世界" },
  { href: "/labs", label: "实验室" },
  { href: "/pricing", label: "会员" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/15 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
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
    </header>
  );
}

// TODO: Connect language switcher to i18n routing.
