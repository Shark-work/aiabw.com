import Link from "next/link";
import { Crown } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { userHasActivePro } from "@/lib/trial-quota";

/** 非 Pro 用户可见的推广条；Pro 权益包含「全站无广告」 */
export async function ProPromoStrip() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const admin = createSupabaseAdminClient();
    const isPro = await userHasActivePro(admin, data.user.id);
    if (isPro) return null;
  }

  return (
    <div className="relative z-20 border-b border-violet-400/20 bg-gradient-to-r from-violet-950/90 via-slate-950/90 to-cyan-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-center text-sm text-slate-200 sm:justify-between sm:text-left">
        <span className="inline-flex items-center gap-2">
          <Crown className="h-4 w-4 text-violet-300" />
          升级 AIABW Pro · 无限试用 · 无广告 · 19.9 USDT/月起
        </span>
        <Link
          href="/pro"
          className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20"
        >
          了解 Pro
        </Link>
      </div>
    </div>
  );
}
