import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

export const SITE_STATS_KEYS = {
  totalPageViews: "total_page_views",
  lastViewAt: "last_page_view_at",
} as const;

export async function getTotalPageViews(admin: Admin): Promise<number> {
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", SITE_STATS_KEYS.totalPageViews)
    .maybeSingle();

  const n = Number(data?.value ?? 0);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export async function incrementPageViews(admin: Admin, delta = 1): Promise<number> {
  const current = await getTotalPageViews(admin);
  const next = current + delta;
  const now = new Date().toISOString();

  await admin.from("site_settings").upsert(
    [
      { key: SITE_STATS_KEYS.totalPageViews, value: String(next) },
      { key: SITE_STATS_KEYS.lastViewAt, value: now },
    ],
    { onConflict: "key" }
  );

  return next;
}

export function formatPageViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 10_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString("zh-CN");
}
