import { ImageResponse } from "next/og";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/growth";
import { getCachedImage, setCachedImage } from "@/lib/share-card-cache";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const ref = (searchParams.get("ref") ?? "aiabw").slice(0, 20);
  const cacheKey = `${CACHE_KEYS.shareCardPrefix}${slug}:${ref}`;

  const admin = createSupabaseAdminClient();
  const cached = await getCachedImage(admin, cacheKey);

  if (cached) {
    return new Response(cached.bytes, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": `public, max-age=${CACHE_TTL.shareCard}, immutable`,
        "CDN-Cache-Control": `public, max-age=${CACHE_TTL.shareCard}`,
      },
    });
  }

  const { data: agent } = await admin
    .from("agents")
    .select("name, description, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return new Response("Not found", { status: 404 });
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "linear-gradient(135deg, #02040a 0%, #0a1628 50%, #1a0a2e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "rgba(0,245,255,0.2)",
              border: "2px solid rgba(0,245,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: 22, color: "#00f5ff", letterSpacing: 4 }}>AIABW · 艾比世界</div>
        </div>
        <div>
          <div style={{ fontSize: 52, fontWeight: 700, marginBottom: 16, lineHeight: 1.1 }}>{agent.name}</div>
          <div style={{ fontSize: 24, color: "#94a3b8", lineHeight: 1.4, maxWidth: 900 }}>{agent.description.slice(0, 80)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(168,85,247,0.25)",
              border: "1px solid rgba(168,85,247,0.5)",
              fontSize: 20,
            }}
          >
            邀请码 · {ref}
          </div>
          <div style={{ fontSize: 18, color: "#64748b" }}>aiabw.com/agents/{agent.slug}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  const arrayBuffer = await image.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  await setCachedImage(admin, cacheKey, bytes, "image/png");

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${CACHE_TTL.shareCard}, immutable`,
      "CDN-Cache-Control": `public, max-age=${CACHE_TTL.shareCard}`,
    },
  });
}
