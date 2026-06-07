import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

export async function getCacheJson<T>(admin: Admin, key: string): Promise<T | null> {
  const { data } = await admin
    .from("platform_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data.payload as T;
}

export async function setCacheJson(admin: Admin, key: string, payload: Json, ttlSeconds: number) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await admin.from("platform_cache").upsert(
    {
      cache_key: key,
      payload,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" }
  );
}

export async function getCacheBinary(admin: Admin, key: string) {
  const { data } = await admin
    .from("platform_cache")
    .select("binary_payload, content_type, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  if (!data?.binary_payload) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return {
    bytes: data.binary_payload as unknown as Uint8Array,
    contentType: data.content_type ?? "image/png",
  };
}

export async function setCacheBinary(
  admin: Admin,
  key: string,
  bytes: Uint8Array,
  contentType: string,
  ttlSeconds: number
) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await admin.from("platform_cache").upsert(
    {
      cache_key: key,
      payload: {} as Json,
      binary_payload: Buffer.from(bytes) as unknown as string,
      content_type: contentType,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" }
  );
}

export function hashSearchKey(q: string, tags: string[], category?: string, filters?: string) {
  const normalized = `${q.trim().toLowerCase()}|${tags.sort().join(",")}|${category ?? ""}|${filters ?? ""}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `search:${Math.abs(hash)}`;
}
