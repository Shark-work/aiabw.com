import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

export type AgentRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  prompt: string | null;
  system_prompt: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  demo_url: string | null;
  model: string | null;
  temperature: number;
  status: "draft" | "active" | "archived";
  visibility: "public" | "private" | "unlisted";
  category_id: string | null;
  created_by: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type AgentListItem = Pick<AgentRow, "slug" | "name" | "description" | "metadata"> & {
  category: { name: string; slug: string } | null;
};

export async function fetchPublicAgents(
  supabase: SupabaseClient<Database>,
  limit = 50
): Promise<AgentListItem[]> {
  const { data } = await supabase
    .from("agents")
    .select("slug, name, description, metadata, category:categories(name, slug)")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data ?? []) as unknown as AgentListItem[];
}

export async function fetchPublicAgentBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<(AgentRow & { category: { name: string; slug: string } | null }) | null> {
  const { data, error } = await supabase
    .from("agents")
    .select("*, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as AgentRow & { category: { name: string; slug: string } | null };
}

export async function fetchCategories(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.from("categories").select("slug, name").order("sort_order", { ascending: true });
  return data ?? [];
}
