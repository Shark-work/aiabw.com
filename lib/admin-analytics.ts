import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

function utcDayStart(daysAgo = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucketByDay(rows: { created_at: string }[], days: string[]) {
  const map = new Map(days.map((d) => [d, 0]));
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + 1);
  }
  return days.map((day) => ({ day, value: map.get(day) ?? 0 }));
}

function bucketRevenueByDay(
  rows: { created_at: string; price_amount: number; payment_status: string }[],
  days: string[]
) {
  const map = new Map(days.map((d) => [d, 0]));
  for (const row of rows) {
    if (!["finished", "confirmed", "confirmed_finished"].includes(row.payment_status)) continue;
    const day = row.created_at.slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + Number(row.price_amount));
  }
  return days.map((day) => ({ day, value: Math.round((map.get(day) ?? 0) * 100) / 100 }));
}

export async function fetchAdminDashboard(admin: Admin) {
  const todayStart = utcDayStart(0);
  const monthStart = monthStartIso();
  const days = last7Days();
  const weekStart = `${days[0]}T00:00:00.000Z`;
  const onlineSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const [
    profilesRes,
    todayProfilesRes,
    paidSubsRes,
    monthTxRes,
    allTxRes,
    agentsRes,
    weekProfilesRes,
    weekTxRes,
    weekChatsRes,
    onlineRes,
    todayPaidRes,
    pendingCreatorWdRes,
    pendingReferralWdRes,
    topAgentsRes,
    topCreatorsRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("transactions")
      .select("price_amount, payment_status")
      .gte("created_at", monthStart)
      .in("payment_status", ["finished", "confirmed", "confirmed_finished"]),
    admin.from("transactions").select("*", { count: "exact", head: true }),
    admin.from("agents").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("created_at").gte("created_at", weekStart),
    admin.from("transactions").select("created_at, price_amount, payment_status").gte("created_at", weekStart),
    admin.from("trial_logs").select("created_at").gte("created_at", weekStart),
    admin.from("trial_logs").select("user_id").gte("created_at", onlineSince),
    admin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart)
      .in("payment_status", ["finished", "confirmed", "confirmed_finished"]),
    admin
      .from("creator_withdrawals")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("referral_withdrawals")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("agents")
      .select("id, slug, name, sales_count, metadata")
      .order("sales_count", { ascending: false })
      .limit(10),
    admin
      .from("creator_earnings")
      .select("creator_user_id, creator_usd")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const monthRevenue = (monthTxRes.data ?? []).reduce((s, r) => s + Number(r.price_amount), 0);
  const onlineUsers = new Set((onlineRes.data ?? []).map((r) => r.user_id).filter(Boolean)).size;

  const creatorTotals = new Map<string, number>();
  for (const row of topCreatorsRes.data ?? []) {
    const id = row.creator_user_id;
    creatorTotals.set(id, (creatorTotals.get(id) ?? 0) + Number(row.creator_usd));
  }
  const topCreatorIds = [...creatorTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topCreators: Array<{ userId: string; name: string; earnings: number }> = [];
  if (topCreatorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", topCreatorIds);
    const nameMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? p.user_id.slice(0, 8)])
    );
    topCreators = topCreatorIds.map((id) => ({
      userId: id,
      name: nameMap.get(id) ?? id.slice(0, 8),
      earnings: Math.round((creatorTotals.get(id) ?? 0) * 100) / 100,
    }));
  }

  return {
    cards: {
      totalUsers: profilesRes.count ?? 0,
      todayNewUsers: todayProfilesRes.count ?? 0,
      totalPaidUsers: paidSubsRes.count ?? 0,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      totalOrders: allTxRes.count ?? 0,
      totalAgents: agentsRes.count ?? 0,
    },
    realtime: {
      onlineUsers,
      todayPaidOrders: todayPaidRes.count ?? 0,
      pendingWithdrawals: (pendingCreatorWdRes.count ?? 0) + (pendingReferralWdRes.count ?? 0),
    },
    trends: {
      newUsers: bucketByDay(weekProfilesRes.data ?? [], days),
      revenue: bucketRevenueByDay(weekTxRes.data ?? [], days),
      chats: bucketByDay(weekChatsRes.data ?? [], days),
    },
    topAgents: (topAgentsRes.data ?? []).map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      sales: a.sales_count ?? 0,
    })),
    topCreators,
  };
}

export async function logAdminAction(
  admin: Admin,
  input: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId?: string;
    detail?: Record<string, unknown>;
  }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("admin_audit_log").insert({
      admin_user_id: input.adminUserId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      detail: input.detail ?? {},
    });
  } catch {
    /* admin_audit_log optional until migration_admin_ops.sql */
  }
}
