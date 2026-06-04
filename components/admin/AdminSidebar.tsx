"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bot,
  Crown,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin-constants";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  bot: Bot,
  receipt: Receipt,
  crown: Crown,
  wallet: Wallet,
  shield: Shield,
  package: Package,
  "arrow-left-right": ArrowLeftRight,
  settings: Settings,
} as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-2 rounded-2xl border border-cyan-300/15 bg-black/30 p-3 shadow-[0_0_40px_rgba(0,245,255,0.06)]">
        <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-cyan-300/60">运营后台</div>
        {ADMIN_NAV.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-gradient-to-r from-cyan-400/15 to-violet-400/15 text-white shadow-[inset_0_0_20px_rgba(0,245,255,0.08)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-300/80" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
