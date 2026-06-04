import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-analytics";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Json } from "@/types/database.types";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "withdrawals";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const status = url.searchParams.get("status")?.trim() ?? "";
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();

  if (tab === "summary") {
    const [cw, rw, ce, rc] = await Promise.all([
      admin.from("creator_wallets").select("available_usd, total_earned_usd, total_withdrawn_usd"),
      admin.from("referral_wallets").select("available_usd, total_earned_usd, total_withdrawn_usd"),
      admin.from("creator_earnings").select("creator_usd"),
      admin.from("referral_commissions").select("commission_usd"),
    ]);

    const sum = (rows: { available_usd?: number; total_earned_usd?: number; total_withdrawn_usd?: number }[] | null) => ({
      available: (rows ?? []).reduce((s, r) => s + Number(r.available_usd ?? 0), 0),
      earned: (rows ?? []).reduce((s, r) => s + Number(r.total_earned_usd ?? 0), 0),
      withdrawn: (rows ?? []).reduce((s, r) => s + Number(r.total_withdrawn_usd ?? 0), 0),
    });

    return NextResponse.json({
      ok: true,
      summary: {
        creator: sum(cw.data),
        referral: sum(rw.data),
        creatorCommissionTotal: (ce.data ?? []).reduce((s, r) => s + Number(r.creator_usd), 0),
        referralCommissionTotal: (rc.data ?? []).reduce((s, r) => s + Number(r.commission_usd), 0),
      },
    });
  }

  if (tab === "commissions") {
    const { data, count, error } = await admin
      .from("referral_commissions")
      .select("id, inviter_user_id, transaction_id, gross_usd, commission_usd, commission_rate, status, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, rows: data ?? [], total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
  }

  const table = url.searchParams.get("wallet") === "referral" ? "referral_withdrawals" : "creator_withdrawals";
  let query = admin
    .from(table)
    .select("id, user_id, amount_usd, payout_address, status, provider_payout_id, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((w) => w.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? p.user_id.slice(0, 8)])
  );

  const rows = (data ?? []).map((w) => ({
    ...w,
    userName: nameMap.get(w.user_id) ?? "—",
    walletType: table === "referral_withdrawals" ? "referral" : "creator",
  }));

  return NextResponse.json({ ok: true, rows, total: count ?? 0, page, pageSize: ADMIN_PAGE_SIZE });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    withdrawalId?: string;
    walletType?: "creator" | "referral";
    action?: string;
    note?: string;
  };

  if (!body.withdrawalId || !body.action) {
    return NextResponse.json({ ok: false, error: "缺少 withdrawalId 或 action" }, { status: 400 });
  }

  const table = body.walletType === "referral" ? "referral_withdrawals" : "creator_withdrawals";
  const admin = createSupabaseAdminClient();

  let status = "pending";
  if (body.action === "approve") status = "approved";
  if (body.action === "reject") status = "rejected";
  if (body.action === "paid") status = "paid";

  const { error } = await admin
    .from(table)
    .update({
      status,
      raw: { admin_note: body.note ?? "", reviewed_at: new Date().toISOString() } as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.withdrawalId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logAdminAction(admin, {
    adminUserId: auth.user.id,
    action: `withdrawal_${body.action}`,
    targetType: "withdrawal",
    targetId: body.withdrawalId,
    detail: { walletType: body.walletType, note: body.note },
  });

  return NextResponse.json({ ok: true });
}
