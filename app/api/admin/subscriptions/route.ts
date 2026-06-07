import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { activateProSubscription } from "@/lib/pro-subscription";
import type { Json } from "@/types/database.types";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("subscriptions")
    .select(
      "id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, subscription_plans(name, slug, interval)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as "active");

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? p.user_id.slice(0, 8)])
  );

  let rows = (data ?? []).map((s) => {
    const plan = s.subscription_plans as { name?: string; slug?: string; interval?: string } | null;
    return {
      id: s.id,
      userId: s.user_id,
      userName: nameMap.get(s.user_id) ?? "—",
      planName: plan?.name ?? "—",
      planSlug: plan?.slug ?? "—",
      status: s.status,
      periodStart: s.current_period_start,
      periodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      createdAt: s.created_at,
    };
  });

  if (q) {
    rows = rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(q.toLowerCase()) ||
        r.planSlug.toLowerCase().includes(q.toLowerCase())
    );
  }

  return NextResponse.json({ ok: true, rows, total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    subscriptionId?: string;
    userId?: string;
    action?: string;
    planSlug?: string;
    extendMonths?: number;
  };

  const admin = createSupabaseAdminClient();

  if (body.action === "activate" && body.userId && body.planSlug) {
    const result = await activateProSubscription(admin, {
      userId: body.userId,
      planSlug: body.planSlug,
      subscriptionStatus: "active",
      providerPaymentId: `admin_activate_${Date.now()}`,
      webhookPayload: { admin: true } as Json,
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    await logAdminAction(admin, {
      adminUserId: auth.user.id,
      action: "activate_subscription",
      targetType: "subscription",
      targetId: body.userId,
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.subscriptionId || !body.action) {
    return NextResponse.json({ ok: false, error: "缺少 subscriptionId 或 action" }, { status: 400 });
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id, current_period_end, status")
    .eq("id", body.subscriptionId)
    .maybeSingle();

  if (!sub) return NextResponse.json({ ok: false, error: "订阅不存在" }, { status: 404 });

  if (body.action === "cancel") {
    await admin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString(), cancel_at_period_end: true })
      .eq("id", body.subscriptionId);
  } else if (body.action === "extend") {
    const months = body.extendMonths ?? 1;
    const base = sub.current_period_end && new Date(sub.current_period_end) > new Date()
      ? new Date(sub.current_period_end)
      : new Date();
    base.setMonth(base.getMonth() + months);
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_end: base.toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
      })
      .eq("id", body.subscriptionId);
  }

  await logAdminAction(admin, {
    adminUserId: auth.user.id,
    action: body.action,
    targetType: "subscription",
    targetId: body.subscriptionId,
  });

  return NextResponse.json({ ok: true });
}
