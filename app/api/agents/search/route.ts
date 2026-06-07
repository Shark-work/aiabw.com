import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { isExploreFilterId, type ExploreFilterId } from "@/lib/explore-filters";
import { searchAgents } from "@/lib/search";

function parseFilters(raw: string | null): ExploreFilterId[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ExploreFilterId => isExploreFilterId(s));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const filters = parseFilters(searchParams.get("filter"));
  const categorySlug = searchParams.get("category") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 24);
  const offset = Number(searchParams.get("offset") ?? 0);

  const admin = createSupabaseAdminClient();
  const agents = await searchAgents(admin, { q, tags, filters, categorySlug, limit, offset });

  return NextResponse.json(
    { ok: true, agents, count: agents.length, cached: true },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    q?: string;
    tags?: string[];
    filter?: string | string[];
    category?: string;
    limit?: number;
    offset?: number;
  };

  const filterRaw = body.filter;
  const filters = Array.isArray(filterRaw)
    ? filterRaw.filter((s): s is ExploreFilterId => isExploreFilterId(s))
    : filterRaw && isExploreFilterId(filterRaw)
      ? [filterRaw]
      : [];

  const admin = createSupabaseAdminClient();
  const agents = await searchAgents(admin, {
    q: body.q,
    tags: body.tags,
    filters,
    categorySlug: body.category,
    limit: body.limit,
    offset: body.offset,
  });

  return NextResponse.json(
    { ok: true, agents, count: agents.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
