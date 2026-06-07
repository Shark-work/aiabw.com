import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const moderation = url.searchParams.get("moderation")?.trim() ?? "";
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("agents")
    .select(
      "id, slug, name, status, visibility, category_id, created_by, created_at, metadata, moderation_status, moderation_note, is_featured, sales_count, categories(name, slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as "draft" | "active" | "archived");
  if (moderation) query = query.eq("moderation_status", moderation);
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (category) query = query.eq("categories.slug", category);

  const { data, count, error } = await query.range(from, to);
  if (error) {
    // fallback if migration not run
    if (error.message.includes("moderation_status")) {
      let fb = admin
        .from("agents")
        .select("id, slug, name, status, visibility, category_id, created_by, created_at, metadata", {
          count: "exact",
        })
        .order("created_at", { ascending: false });
      if (status) fb = fb.eq("status", status as "draft" | "active" | "archived");
      if (q) fb = fb.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
      const res = await fb.range(from, to);
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
      return NextResponse.json({ ok: true, rows: res.data ?? [], total: res.count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const creatorIds = [...new Set((data ?? []).map((a) => a.created_by).filter(Boolean))] as string[];
  const { data: creators } = creatorIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", creatorIds)
    : { data: [] };
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c.display_name ?? c.username ?? "—"]));

  const rows = (data ?? []).map((a) => {
    const meta = (a.metadata ?? {}) as Record<string, unknown>;
    const cat = a.categories as { name?: string; slug?: string } | null;
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      creator: a.created_by ? creatorMap.get(a.created_by) ?? a.created_by.slice(0, 8) : "—",
      category: cat?.name ?? "—",
      priceUsdt: meta.price_usdt ?? 0,
      status: a.status,
      moderationStatus: (a as { moderation_status?: string }).moderation_status ?? "approved",
      isFeatured: (a as { is_featured?: boolean }).is_featured ?? false,
      sales: (a as { sales_count?: number }).sales_count ?? 0,
      createdAt: a.created_at,
    };
  });

  return NextResponse.json({ ok: true, rows, total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    agentIds?: string[];
    agentId?: string;
    action?: string;
    note?: string;
    featured?: boolean;
  };

  const ids = body.agentIds?.length ? body.agentIds : body.agentId ? [body.agentId] : [];
  if (!ids.length || !body.action) {
    return NextResponse.json({ ok: false, error: "缺少 agentId 或 action" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const patch: Record<string, unknown> = {};

  switch (body.action) {
    case "approve":
      patch.status = "active";
      patch.visibility = "public";
      patch.moderation_status = "approved";
      patch.moderation_note = null;
      break;
    case "reject":
      patch.status = "archived";
      patch.moderation_status = "rejected";
      patch.moderation_note = body.note ?? "不符合内容政策";
      break;
    case "publish":
      patch.status = "active";
      patch.visibility = "public";
      break;
    case "unpublish":
      patch.status = "archived";
      break;
    case "feature":
      patch.is_featured = body.featured !== false;
      break;
    case "unfeature":
      patch.is_featured = false;
      break;
    case "delete":
      await admin.from("agents").delete().in("id", ids);
      await logAdminAction(admin, {
        adminUserId: auth.user.id,
        action: "delete_agents",
        targetType: "agent",
        detail: { ids },
      });
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: false, error: "未知 action" }, { status: 400 });
  }

  const { error } = await admin.from("agents").update(patch).in("id", ids);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logAdminAction(admin, {
    adminUserId: auth.user.id,
    action: body.action,
    targetType: "agent",
    detail: { ids, patch },
  });

  return NextResponse.json({ ok: true });
}
