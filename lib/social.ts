import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

export async function isAgentFavorited(admin: Admin, userId: string, agentId: string) {
  const { data } = await admin
    .from("agent_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleAgentFavorite(admin: Admin, userId: string, agentId: string, favorited: boolean) {
  if (favorited) {
    const { error } = await admin.from("agent_favorites").insert({ user_id: userId, agent_id: agentId });
    if (error && !error.message.includes("duplicate")) return { ok: false as const, error: error.message };
    return { ok: true as const, favorited: true };
  }
  const { error } = await admin.from("agent_favorites").delete().eq("user_id", userId).eq("agent_id", agentId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, favorited: false };
}

export async function isFollowingCreator(admin: Admin, followerId: string, creatorId: string) {
  if (followerId === creatorId) return false;
  const { data } = await admin
    .from("creator_follows")
    .select("id")
    .eq("follower_user_id", followerId)
    .eq("creator_user_id", creatorId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleCreatorFollow(
  admin: Admin,
  followerId: string,
  creatorId: string,
  following: boolean
) {
  if (followerId === creatorId) {
    return { ok: false as const, error: "不能关注自己" };
  }
  if (following) {
    const { error } = await admin.from("creator_follows").insert({
      follower_user_id: followerId,
      creator_user_id: creatorId,
    });
    if (error && !error.message.includes("duplicate")) return { ok: false as const, error: error.message };
    return { ok: true as const, following: true };
  }
  const { error } = await admin
    .from("creator_follows")
    .delete()
    .eq("follower_user_id", followerId)
    .eq("creator_user_id", creatorId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, following: false };
}

export type FavoriteAgentRow = {
  agentId: string;
  slug: string;
  name: string;
  description: string;
  favoritedAt: string;
  categoryName: string | null;
};

export async function listUserFavoriteAgents(admin: Admin, userId: string, limit = 50): Promise<FavoriteAgentRow[]> {
  const { data: favs } = await admin
    .from("agent_favorites")
    .select("agent_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const agentIds = (favs ?? []).map((f) => f.agent_id);
  if (!agentIds.length) return [];

  const { data: agents } = await admin
    .from("agents")
    .select("id, slug, name, description, category:categories(name)")
    .in("id", agentIds)
    .eq("status", "active");

  const agentMap = new Map((agents ?? []).map((a) => [a.id, a]));

  return (favs ?? [])
    .map((f) => {
      const a = agentMap.get(f.agent_id);
      if (!a) return null;
      const cat = a.category as unknown as { name: string } | null;
      return {
        agentId: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        favoritedAt: f.created_at,
        categoryName: cat?.name ?? null,
      };
    })
    .filter(Boolean) as FavoriteAgentRow[];
}
