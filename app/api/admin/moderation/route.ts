import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "pending";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();

  if (tab === "rejected") {
    const query = admin
      .from("agents")
      .select(
        "id, slug, name, created_by, created_at, moderation_status, moderation_note, status",
        { count: "exact" }
      )
      .eq("moderation_status", "rejected")
      .order("created_at", { ascending: false });

    const { data, count, error } = await query.range(from, to);
    if (error) {
      const fb = await admin
        .from("agents")
        .select("id, slug, name, created_by, created_at, status, metadata")
        .eq("status", "archived")
        .order("created_at", { ascending: false })
        .range(from, to);
      return NextResponse.json({
        ok: true,
        rows: fb.data ?? [],
        total: fb.count ?? 0,
        page,
        pageSize: ADMIN_PAGE_SIZE,
      });
    }
    return NextResponse.json({ ok: true, rows: data ?? [], total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
  }

  const query = admin
    .from("agents")
    .select(
      "id, slug, name, description, created_by, created_at, status, moderation_status, moderation_note, metadata",
      { count: "exact" }
    )
    .or("moderation_status.eq.pending,status.eq.draft")
    .order("created_at", { ascending: false });

  const { data, count, error } = await query.range(from, to);
  if (error) {
    const fb = await admin
      .from("agents")
      .select("id, slug, name, description, created_by, created_at, status, metadata")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .range(from, to);
    return NextResponse.json({
      ok: true,
      rows: fb.data ?? [],
      total: fb.count ?? 0,
      page,
      pageSize: ADMIN_PAGE_SIZE,
    });
  }

  const creatorIds = [...new Set((data ?? []).map((a) => a.created_by).filter(Boolean))] as string[];
  const { data: creators } = creatorIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", creatorIds)
    : { data: [] };
  const creatorMap = new Map(
    (creators ?? []).map((c) => [c.user_id, c.display_name ?? c.username ?? "—"])
  );

  const rows = (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description?.slice(0, 120),
    creator: a.created_by ? creatorMap.get(a.created_by) ?? "—" : "—",
    createdAt: a.created_at,
    status: a.status,
    moderationStatus: (a as { moderation_status?: string }).moderation_status ?? "pending",
    note: (a as { moderation_note?: string }).moderation_note,
  }));

  return NextResponse.json({ ok: true, rows, total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
}
