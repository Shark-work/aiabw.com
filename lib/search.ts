import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { CACHE_TTL } from "@/lib/growth";
import { resolveExploreSearchTags, type ExploreFilterId } from "@/lib/explore-filters";
import { getCacheJson, hashSearchKey, setCacheJson } from "@/lib/platform-cache";
import type { AgentListItem } from "@/lib/agents";

type Admin = SupabaseClient<Database>;

export type SearchParams = {
  q?: string;
  tags?: string[];
  filters?: ExploreFilterId[];
  categorySlug?: string;
  limit?: number;
  offset?: number;
};

type RpcAgentRow = {
  slug: string;
  name: string;
  description: string;
  metadata: Json;
  category_name: string | null;
  category_slug: string | null;
  rank: number | null;
};

function mapRpcRow(row: RpcAgentRow): AgentListItem {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    metadata: row.metadata,
    category:
      row.category_slug && row.category_name
        ? { slug: row.category_slug, name: row.category_name }
        : null,
  };
}

function mergeSearchTags(params: SearchParams): string[] {
  const manual = (params.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const fromFilters = resolveExploreSearchTags(params.filters ?? []);
  return [...new Set([...manual, ...fromFilters])];
}

async function searchAgentsViaRpc(
  admin: Admin,
  q: string,
  tags: string[],
  categorySlug: string | undefined,
  limit: number,
  offset: number
): Promise<AgentListItem[] | null> {
  const { data, error } = await admin.rpc("search_public_agents", {
    p_q: q,
    p_tags: tags.length ? tags : [],
    p_category_slug: categorySlug ?? null,
    p_limit: Math.min(limit + offset, 100),
    p_offset: 0,
  });

  if (error) return null;
  const rows = (data ?? []) as RpcAgentRow[];
  return rows.map(mapRpcRow).slice(offset, offset + limit);
}

async function searchAgentsFallback(
  admin: Admin,
  q: string,
  tags: string[],
  categorySlug: string | undefined
): Promise<AgentListItem[]> {
  let agentIds: string[] | null = null;

  if (tags.length > 0) {
    const { data: tagRows } = await admin.from("agent_tags").select("agent_id, tag").limit(2000);
    const idSet = new Set<string>();
    for (const row of tagRows ?? []) {
      if (tags.includes(row.tag.toLowerCase())) idSet.add(row.agent_id);
    }
    agentIds = [...idSet];
    if (agentIds.length === 0) return [];
  }

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await admin.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
    categoryId = cat?.id ?? null;
    if (!categoryId) return [];
  }

  let query = admin
    .from("agents")
    .select("slug, name, description, metadata, category:categories(name, slug)")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(100);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (agentIds) query = query.in("id", agentIds);

  const { data: rows } = await query;
  let filtered = (rows ?? []) as unknown as AgentListItem[];

  if (q.length >= 2) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower) ||
        a.slug.toLowerCase().includes(lower)
    );
  }

  if (tags.length > 0) {
    filtered = filtered.filter((a) => {
      const metaTags = ((a.metadata as Record<string, unknown>)?.tags as string[] | undefined) ?? [];
      const normalized = metaTags.map((x) => x.toLowerCase());
      return tags.some((t) => normalized.includes(t));
    });
  }

  return filtered;
}

export async function searchAgents(admin: Admin, params: SearchParams): Promise<AgentListItem[]> {
  const q = (params.q ?? "").trim();
  const tags = mergeSearchTags(params);
  const limit = Math.min(params.limit ?? 24, 48);
  const offset = params.offset ?? 0;
  const filterKey = (params.filters ?? []).sort().join(",");

  const cacheKey = hashSearchKey(q, tags, params.categorySlug, filterKey);
  const cached = await getCacheJson<AgentListItem[]>(admin, cacheKey);
  if (cached) return cached.slice(offset, offset + limit);

  const fetchLimit = Math.min(limit + offset, 48);
  let results =
    (await searchAgentsViaRpc(admin, q, tags, params.categorySlug, fetchLimit, 0)) ??
    (await searchAgentsFallback(admin, q, tags, params.categorySlug));

  await setCacheJson(admin, cacheKey, results as unknown as Json, CACHE_TTL.search);
  return results.slice(offset, offset + limit);
}

export async function fetchAllPublicTags(admin: Admin): Promise<string[]> {
  const cacheKey = "tags:all";
  const cached = await getCacheJson<string[]>(admin, cacheKey);
  if (cached) return cached;

  const { data } = await admin.from("agent_tags").select("tag").limit(500);
  const tags = [...new Set((data ?? []).map((r) => r.tag))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  await setCacheJson(admin, cacheKey, tags, CACHE_TTL.search);
  return tags;
}
