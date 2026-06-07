import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { creatorEarningsFromSale } from "@/lib/creator-pricing";
import {
  CREATOR_SHARE_RATE,
  REFERRAL_COMMISSION_RATE,
  CACHE_KEYS,
  CACHE_TTL,
} from "@/lib/growth";
import { setCacheJson } from "@/lib/platform-cache";
import { recomputeReferralWalletForUser } from "@/lib/referral-wallet";

type Admin = SupabaseClient<Database>;

export async function recordRevenueEvent(
  admin: Admin,
  input: {
    transactionId: string;
    eventType: string;
    grossUsd: number;
    buyerUserId: string;
    agentId: string | null;
    referralCode: string | null;
    inviterUserId: string | null;
  }
) {
  let creatorUserId: string | null = null;
  if (input.agentId) {
    const { data: agent } = await admin.from("agents").select("created_by").eq("id", input.agentId).maybeSingle();
    creatorUserId = agent?.created_by ?? null;
  }

  await admin.from("revenue_events").upsert(
    {
      transaction_id: input.transactionId,
      event_type: input.eventType,
      gross_usd: input.grossUsd,
      buyer_user_id: input.buyerUserId,
      agent_id: input.agentId,
      creator_user_id: creatorUserId,
      inviter_user_id: input.inviterUserId,
      referral_code: input.referralCode,
      processed: false,
    },
    { onConflict: "transaction_id" }
  );
}

export async function processPendingRevenueEvents(admin: Admin, batchSize = 100) {
  const { data: events } = await admin
    .from("revenue_events")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  let processed = 0;

  for (const event of events ?? []) {
    const gross = Number(event.gross_usd);

    if (event.inviter_user_id && gross > 0) {
      const commission = Math.round(gross * REFERRAL_COMMISSION_RATE * 100) / 100;
      await admin.from("referral_commissions").upsert(
        {
          inviter_user_id: event.inviter_user_id,
          transaction_id: event.transaction_id,
          gross_usd: gross,
          commission_usd: commission,
          commission_rate: REFERRAL_COMMISSION_RATE,
          status: "settled",
        },
        { onConflict: "transaction_id" }
      );
    }

    if (event.creator_user_id && event.agent_id && gross > 0) {
      const { creatorUsd, platformUsd, creatorRate } = creatorEarningsFromSale(gross);
      await admin.from("creator_earnings").upsert(
        {
          creator_user_id: event.creator_user_id,
          transaction_id: event.transaction_id,
          agent_id: event.agent_id,
          gross_usd: gross,
          creator_usd: creatorUsd,
          platform_usd: platformUsd,
          creator_rate: creatorRate,
          status: "settled",
        },
        { onConflict: "transaction_id" }
      );
    }

    await admin.from("revenue_events").update({ processed: true }).eq("id", event.id);
    processed += 1;
  }

  return processed;
}

export async function recomputeCreatorWallets(admin: Admin) {
  const { data: creators } = await admin.from("creator_earnings").select("creator_user_id").limit(1000);
  const ids = [...new Set((creators ?? []).map((c) => c.creator_user_id))];

  for (const userId of ids) {
    const { data: earnings } = await admin
      .from("creator_earnings")
      .select("creator_usd")
      .eq("creator_user_id", userId)
      .eq("status", "settled");

    const totalEarned = (earnings ?? []).reduce((sum, e) => sum + Number(e.creator_usd), 0);

    const { data: withdrawals } = await admin
      .from("creator_withdrawals")
      .select("amount_usd, status")
      .eq("user_id", userId)
      .in("status", ["pending", "processing", "completed"]);

    const withdrawn = (withdrawals ?? [])
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + Number(w.amount_usd), 0);

    const pendingWithdraw = (withdrawals ?? [])
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + Number(w.amount_usd), 0);

    const available = Math.max(0, Math.round((totalEarned - withdrawn - pendingWithdraw) * 100) / 100);

    await admin.from("creator_wallets").upsert(
      {
        user_id: userId,
        available_usd: available,
        pending_usd: pendingWithdraw,
        total_earned_usd: totalEarned,
        total_withdrawn_usd: withdrawn,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }
}

export async function recomputeReferralWallets(admin: Admin) {
  const { data: inviters } = await admin.from("referral_commissions").select("inviter_user_id").limit(2000);
  const { data: walletUsers } = await admin.from("referral_wallets").select("user_id").limit(2000);
  const ids = [
    ...new Set([
      ...(inviters ?? []).map((i) => i.inviter_user_id),
      ...(walletUsers ?? []).map((w) => w.user_id),
    ]),
  ];

  for (const userId of ids) {
    await recomputeReferralWalletForUser(admin, userId);
  }
}

export async function recomputeReferralStatsCache(admin: Admin, onlyUserId?: string) {
  const ids = onlyUserId
    ? [onlyUserId]
    : [
        ...new Set([
          ...((await admin.from("referral_commissions").select("inviter_user_id").limit(2000)).data ?? []).map(
            (i) => i.inviter_user_id
          ),
          ...((await admin.from("invite_relationships").select("inviter_user_id").limit(2000)).data ?? []).map(
            (i) => i.inviter_user_id
          ),
        ]),
      ];

  for (const userId of ids) {
    const wallet = await recomputeReferralWalletForUser(admin, userId);

    const { count: inviteCount } = await admin
      .from("invite_relationships")
      .select("*", { count: "exact", head: true })
      .eq("inviter_user_id", userId);

    await setCacheJson(
      admin,
      `${CACHE_KEYS.referralStatsPrefix}${userId}`,
      {
        inviteCount: inviteCount ?? 0,
        totalCommissionUsd: wallet.totalEarned,
        availableUsd: wallet.available,
        pendingUsd: wallet.pendingWithdraw,
        commissionRate: REFERRAL_COMMISSION_RATE,
        updatedAt: new Date().toISOString(),
      },
      CACHE_TTL.referralStats
    );
  }
}

export async function recomputeWeeklyLeaderboard(admin: Admin) {
  const { refreshWeeklyLeaderboardCache } = await import("@/lib/leaderboard");
  return refreshWeeklyLeaderboardCache(admin);
}

export async function recomputeHomeStats(admin: Admin) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: agentCount }, { count: userCount }, { count: weeklySales }, { data: featured }] = await Promise.all([
    admin.from("agents").select("*", { count: "exact", head: true }).eq("status", "active").eq("visibility", "public"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("order_type", "agent")
      .eq("payment_status", "finished")
      .gte("created_at", weekAgo),
    admin
      .from("agents")
      .select("slug, name, description, metadata, category:categories(name)")
      .eq("status", "active")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const stats = {
    agentCount: agentCount ?? 0,
    userCount: userCount ?? 0,
    weeklyAgentSales: weeklySales ?? 0,
    featuredAgents: featured ?? [],
    updatedAt: new Date().toISOString(),
  };

  await setCacheJson(admin, CACHE_KEYS.homeStats, stats, CACHE_TTL.homeStats);
  return stats;
}
