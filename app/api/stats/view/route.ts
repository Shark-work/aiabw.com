import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getClientIp } from "@/lib/chat-rate-limit";
import { formatPageViews, getTotalPageViews, incrementPageViews } from "@/lib/site-analytics";

export const runtime = "nodejs";

const viewBuckets = globalThis as typeof globalThis & {
  __aiabwViewRl?: Map<string, number[]>;
};

function allowViewHit(ip: string): boolean {
  if (!viewBuckets.__aiabwViewRl) viewBuckets.__aiabwViewRl = new Map();
  const key = `view:${ip}`;
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 30;
  const prev = viewBuckets.__aiabwViewRl.get(key) ?? [];
  const pruned = prev.filter((t) => t > now - windowMs);
  if (pruned.length >= limit) {
    viewBuckets.__aiabwViewRl.set(key, pruned);
    return false;
  }
  pruned.push(now);
  viewBuckets.__aiabwViewRl.set(key, pruned);
  return true;
}

export async function GET() {
  const admin = createSupabaseAdminClient();
  const total = await getTotalPageViews(admin);

  return NextResponse.json(
    { ok: true, total, formatted: formatPageViews(total) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!allowViewHit(ip)) {
    const admin = createSupabaseAdminClient();
    const total = await getTotalPageViews(admin);
    return NextResponse.json({ ok: true, total, skipped: true });
  }

  let path = "/";
  try {
    const body = (await req.json()) as { path?: string };
    path = body.path?.slice(0, 200) ?? "/";
  } catch {
    // empty body ok
  }

  const admin = createSupabaseAdminClient();
  const total = await incrementPageViews(admin, 1);

  return NextResponse.json({ ok: true, total, formatted: formatPageViews(total), path });
}
