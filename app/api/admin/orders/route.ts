import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { activateProSubscription } from "@/lib/pro-subscription";
import { fulfillAgentPurchase } from "@/lib/purchases";
import type { Json } from "@/types/database.types";

const SUCCESS = ["finished", "confirmed", "confirmed_finished"];

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const fromDate = url.searchParams.get("from")?.trim() ?? "";
  const toDate = url.searchParams.get("to")?.trim() ?? "";
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("transactions")
    .select(
      "id, order_id, user_id, plan_slug, order_type, agent_id, payment_status, price_amount, price_currency, provider_payment_id, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("payment_status", status as "pending");
  if (q) query = query.or(`order_id.ilike.%${q}%,provider_payment_id.ilike.%${q}%`);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((t) => t.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? p.user_id.slice(0, 8)])
  );

  const rows = (data ?? []).map((t) => ({
    id: t.id,
    orderId: t.order_id,
    userId: t.user_id,
    userName: nameMap.get(t.user_id) ?? "—",
    productType: t.order_type === "agent" ? "Agent" : t.order_type === "subscription" ? "订阅" : t.order_type,
    planSlug: t.plan_slug,
    agentId: t.agent_id,
    amount: t.price_amount,
    currency: t.price_currency,
    status: t.payment_status,
    providerPaymentId: t.provider_payment_id,
    createdAt: t.created_at,
  }));

  return NextResponse.json({ ok: true, rows, total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as { orderId?: string; action?: string };
  if (!body.orderId || body.action !== "manual_fulfill") {
    return NextResponse.json({ ok: false, error: "缺少 orderId 或 action" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: tx, error } = await admin.from("transactions").select("*").eq("order_id", body.orderId).maybeSingle();
  if (error || !tx) {
    return NextResponse.json({ ok: false, error: error?.message ?? "订单不存在" }, { status: 404 });
  }

  if (SUCCESS.includes(tx.payment_status)) {
    return NextResponse.json({ ok: false, error: "订单已是成功状态" }, { status: 400 });
  }

  const newStatus = "finished";
  await admin
    .from("transactions")
    .update({
      payment_status: newStatus,
      raw: { ...(tx.raw as object), admin_manual_fulfill: true, at: new Date().toISOString() } as Json,
    })
    .eq("id", tx.id);

  if (tx.order_type === "subscription") {
    await activateProSubscription(admin, {
      userId: tx.user_id,
      planSlug: tx.plan_slug,
      subscriptionStatus: "active",
      providerPaymentId: tx.provider_payment_id ?? `admin_${tx.order_id}`,
      webhookPayload: { manual: true } as Json,
    });
  } else if (tx.order_type === "agent" && tx.agent_id) {
    await fulfillAgentPurchase(admin, {
      transaction: {
        id: tx.id,
        user_id: tx.user_id,
        agent_id: tx.agent_id,
        order_type: tx.order_type,
        payment_status: tx.payment_status,
        price_amount: Number(tx.price_amount),
        referral_code: tx.referral_code,
        inviter_user_id: tx.inviter_user_id,
      },
      newPaymentStatus: newStatus,
    });
  }

  await logAdminAction(admin, {
    adminUserId: auth.user.id,
    action: "manual_fulfill_order",
    targetType: "transaction",
    targetId: tx.id,
    detail: { orderId: body.orderId },
  });

  return NextResponse.json({ ok: true });
}
