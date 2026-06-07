import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { REFERRAL_COMMISSION_RATE, buildInviteLink, CACHE_KEYS } from "@/lib/growth";
import { ensureInviteCode } from "@/lib/referral";
import { getCacheJson, setCacheJson } from "@/lib/platform-cache";
import { CACHE_TTL } from "@/lib/growth";

type Admin = SupabaseClient<Database>;

export const MIN_REFERRAL_WITHDRAWAL_USDT = 10;

export type ReferralInviteeRow = {
  id: string;
  inviteeUserId: string;
  displayLabel: string;
  inviteCode: string;
  createdAt: string;
};

export type ReferralCommissionRow = {
  id: string;
  commissionUsd: number;
  grossUsd: number;
  commissionRate: number;
  status: string;
  createdAt: string;
  orderType: string | null;
  planSlug: string | null;
};

export type ReferralDashboard = {
  code: string;
  inviteLink: string;
  commissionRate: number;
  inviteCount: number;
  totalCommissionUsd: number;
  availableUsd: number;
  pendingUsd: number;
  totalWithdrawnUsd: number;
  invitees: ReferralInviteeRow[];
  commissions: ReferralCommissionRow[];
  updatedAt: string | null;
};

export async function recomputeReferralWalletForUser(admin: Admin, userId: string) {
  const { data: commissions } = await admin
    .from("referral_commissions")
    .select("commission_usd")
    .eq("inviter_user_id", userId)
    .eq("status", "settled");

  const totalEarned = (commissions ?? []).reduce((s, c) => s + Number(c.commission_usd), 0);

  const { data: withdrawals } = await admin
    .from("referral_withdrawals")
    .select("amount_usd, status")
    .eq("user_id", userId)
    .in("status", ["pending", "processing", "completed"]);

  const withdrawn = (withdrawals ?? [])
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + Number(w.amount_usd), 0);

  const pendingWithdraw = (withdrawals ?? [])
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((s, w) => s + Number(w.amount_usd), 0);

  const available = Math.max(0, Math.round((totalEarned - withdrawn - pendingWithdraw) * 100) / 100);

  await admin.from("referral_wallets").upsert(
    {
      user_id: userId,
      available_usd: available,
      pending_usd: pendingWithdraw,
      total_earned_usd: Math.round(totalEarned * 100) / 100,
      total_withdrawn_usd: withdrawn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return { available, pendingWithdraw, totalEarned, withdrawn };
}

export async function getReferralDashboard(
  admin: Admin,
  userId: string,
  appUrl: string
): Promise<ReferralDashboard> {
  const code = await ensureInviteCode(admin, userId);

  await recomputeReferralWalletForUser(admin, userId);

  const { data: wallet } = await admin
    .from("referral_wallets")
    .select("available_usd, pending_usd, total_earned_usd, total_withdrawn_usd, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { count: inviteCount } = await admin
    .from("invite_relationships")
    .select("id", { count: "exact", head: true })
    .eq("inviter_user_id", userId);

  const { data: relationships } = await admin
    .from("invite_relationships")
    .select("id, invitee_user_id, invite_code, created_at")
    .eq("inviter_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const inviteeIds = (relationships ?? []).map((r) => r.invitee_user_id);
  let profileMap = new Map<string, string>();

  if (inviteeIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", inviteeIds);
    profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? `用户 ${p.user_id.slice(0, 8)}`])
    );
  }

  const { data: commissionRows } = await admin
    .from("referral_commissions")
    .select("id, commission_usd, gross_usd, commission_rate, status, created_at, transaction_id")
    .eq("inviter_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const txIds = (commissionRows ?? []).map((c) => c.transaction_id).filter(Boolean);
  let txMap = new Map<string, { order_type: string; plan_slug: string }>();

  if (txIds.length > 0) {
    const { data: txs } = await admin
      .from("transactions")
      .select("id, order_type, plan_slug")
      .in("id", txIds);
    txMap = new Map((txs ?? []).map((t) => [t.id, { order_type: t.order_type, plan_slug: t.plan_slug }]));
  }

  const totalCommissionUsd = Number(wallet?.total_earned_usd ?? 0);

  const dashboard: ReferralDashboard = {
    code,
    inviteLink: buildInviteLink(code, appUrl),
    commissionRate: REFERRAL_COMMISSION_RATE,
    inviteCount: inviteCount ?? 0,
    totalCommissionUsd,
    availableUsd: Number(wallet?.available_usd ?? 0),
    pendingUsd: Number(wallet?.pending_usd ?? 0),
    totalWithdrawnUsd: Number(wallet?.total_withdrawn_usd ?? 0),
    invitees: (relationships ?? []).map((r) => ({
      id: r.id,
      inviteeUserId: r.invitee_user_id,
      displayLabel: profileMap.get(r.invitee_user_id) ?? `好友 ${r.invitee_user_id.slice(0, 8)}`,
      inviteCode: r.invite_code,
      createdAt: r.created_at,
    })),
    commissions: (commissionRows ?? []).map((c) => {
      const tx = txMap.get(c.transaction_id);
      return {
        id: c.id,
        commissionUsd: Number(c.commission_usd),
        grossUsd: Number(c.gross_usd),
        commissionRate: Number(c.commission_rate),
        status: c.status,
        createdAt: c.created_at,
        orderType: tx?.order_type ?? null,
        planSlug: tx?.plan_slug ?? null,
      };
    }),
    updatedAt: wallet?.updated_at ?? new Date().toISOString(),
  };

  await setCacheJson(
    admin,
    `${CACHE_KEYS.referralStatsPrefix}${userId}`,
    {
      inviteCount: dashboard.inviteCount,
      totalCommissionUsd: dashboard.totalCommissionUsd,
      availableUsd: dashboard.availableUsd,
      pendingUsd: dashboard.pendingUsd,
      commissionRate: REFERRAL_COMMISSION_RATE,
      updatedAt: dashboard.updatedAt,
    },
    CACHE_TTL.referralStats
  );

  return dashboard;
}
