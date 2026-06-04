"use client";

import Link from "next/link";
import { Crown, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRO_BENEFITS } from "@/lib/pro-subscription";

type UpgradeProModalProps = {
  open: boolean;
  onClose: () => void;
  limit?: number;
};

export function UpgradeProModal({ open, onClose, limit = 3 }: UpgradeProModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-pro-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[linear-gradient(180deg,rgba(15,10,40,0.98),rgba(6,12,28,0.99))] shadow-[0_0_120px_rgba(139,92,246,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_50%),radial-gradient(circle_at_bottom,rgba(0,245,255,0.12),transparent_40%)]" />
        <div className="relative p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-100">
            <Sparkles className="h-3.5 w-3.5" />
            试用额度已用完
          </div>

          <h2 id="upgrade-pro-title" className="mt-4 text-2xl font-semibold text-white">
            升级 Pro · 无限畅聊
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            免费用户每日仅 {limit} 次试用。今日次数已用完，订阅 Pro 即可解除限制。
          </p>

          <ul className="mt-6 space-y-2">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Button className="w-full" asChild>
              <Link href="/checkout?plan=pro" onClick={onClose}>
                <Crown className="h-4 w-4" />
                订阅 Pro · 19.9 USDT/月起
              </Link>
            </Button>
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/pro" onClick={onClose}>
                查看 Pro 方案
              </Link>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-center text-xs text-slate-500 transition hover:text-slate-300"
            >
              明天再来试用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
