import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CACHE_TTL } from "@/lib/growth";

type Admin = SupabaseClient<Database>;

export async function getCachedImage(admin: Admin, key: string) {
  const { data } = await admin
    .from("platform_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  const payload = data.payload as { imageBase64?: string; contentType?: string } | null;
  if (!payload?.imageBase64) return null;

  const bytes = Uint8Array.from(atob(payload.imageBase64), (c) => c.charCodeAt(0));
  return { bytes, contentType: payload.contentType ?? "image/png" };
}

export async function setCachedImage(admin: Admin, key: string, bytes: Uint8Array, contentType: string) {
  const imageBase64 = Buffer.from(bytes).toString("base64");
  const expiresAt = new Date(Date.now() + CACHE_TTL.shareCard * 1000).toISOString();

  await admin.from("platform_cache").upsert(
    {
      cache_key: key,
      payload: { imageBase64, contentType },
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" }
  );
}
