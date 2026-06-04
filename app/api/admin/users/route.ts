import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { activateProSubscription } from "@/lib/pro-subscription";
import type { Json } from "@/types/database.types";

function parseMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const q = url.searchParams.get("q")?.trim() ?? "";
  const role = url.searchParams.get("role")?.trim() ?? "";
  const sub = url.searchParams.get("sub")?.trim() ?? "";
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("profiles")
    .select("user_id, username, display_name, role, is_creator, metadata, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role as "user" | "creator" | "moderator" | "admin");
  if (q) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data: profiles, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const userIds = (profiles ?? []).map((p) => p.user_id);
  const emailMap = new Map<string, { email: string | null; lastSignIn: string | null }>();

  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emailMap.set(id, {
        email: data.user?.email ?? null,
        lastSignIn: data.user?.last_sign_in_at ?? null,
      });
    })
  );

  const { data: subs } = userIds.length
    ? await admin.from("subscriptions").select("user_id, status, current_period_end, plan_id").in("user_id", userIds)
    : { data: [] };

  const subMap = new Map((subs ?? []).map((s) => [s.user_id, s]));

  let rows = (profiles ?? []).map((p) => {
    const meta = parseMeta(p.metadata);
    const authInfo = emailMap.get(p.user_id);
    const subscription = subMap.get(p.user_id);
    return {
      userId: p.user_id,
      username: p.username,
      displayName: p.display_name,
      email: authInfo?.email ?? null,
      role: p.role,
      banned: meta.banned === true,
      createdAt: p.created_at,
      lastSignIn: authInfo?.lastSignIn,
      subscriptionStatus: subscription?.status ?? "none",
      subscriptionEnd: subscription?.current_period_end ?? null,
    };
  });

  if (sub === "active") rows = rows.filter((r) => r.subscriptionStatus === "active");
  if (sub === "none") rows = rows.filter((r) => r.subscriptionStatus === "none");

  return NextResponse.json({
    ok: true,
    rows,
    total: count ?? 0,
    page,
    pageSize: ADMIN_PAGE_SIZE,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    userId?: string;
    action?: string;
    role?: string;
    banned?: boolean;
    planSlug?: string;
    extendDays?: number;
  };

  if (!body.userId || !body.action) {
    return NextResponse.json({ ok: false, error: "缺少 userId 或 action" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (body.action === "set_role" && body.role) {
    const allowed = ["user", "creator", "moderator", "admin"] as const;
    if (!allowed.includes(body.role as (typeof allowed)[number])) {
      return NextResponse.json({ ok: false, error: "无效角色" }, { status: 400 });
    }
    const role = body.role as (typeof allowed)[number];
    const { error } = await admin.from("profiles").update({ role }).eq("user_id", body.userId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    await logAdminAction(admin, {
      adminUserId: auth.user.id,
      action: "set_role",
      targetType: "user",
      targetId: body.userId,
      detail: { role: body.role },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "set_banned") {
    const { data: profile } = await admin.from("profiles").select("metadata").eq("user_id", body.userId).maybeSingle();
    const meta = parseMeta(profile?.metadata);
    const { error } = await admin
      .from("profiles")
      .update({ metadata: { ...meta, banned: Boolean(body.banned) } as Json })
      .eq("user_id", body.userId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    await logAdminAction(admin, {
      adminUserId: auth.user.id,
      action: "set_banned",
      targetType: "user",
      targetId: body.userId,
      detail: { banned: body.banned },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "extend_subscription") {
    const planSlug = body.planSlug ?? "pro_monthly";
    const result = await activateProSubscription(admin, {
      userId: body.userId,
      planSlug,
      subscriptionStatus: "active",
      providerPaymentId: `admin_manual_${Date.now()}`,
      webhookPayload: { source: "admin", extendDays: body.extendDays ?? 30 } as Json,
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    await logAdminAction(admin, {
      adminUserId: auth.user.id,
      action: "extend_subscription",
      targetType: "user",
      targetId: body.userId,
      detail: { planSlug, extendDays: body.extendDays },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "未知 action" }, { status: 400 });
}
