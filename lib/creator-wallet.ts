import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CREATOR_SHARE_RATE, PLATFORM_SHARE_RATE, MIN_CREATOR_WITHDRAWAL_USDT } from "@/lib/growth";
import { pageOffset, totalPages, EARNINGS_PAGE_SIZE } from "@/lib/pagination";

type Admin = SupabaseClient<Database>;

export type CreatorWithdrawalRow = {
  id: string;
  amountUsd: number;
  status: string;
  payoutAddress: string;
  payCurrency: string;
  providerPayoutId: string | null;
  createdAt: string;
};

export type CreatorEarningRow = {
  id: string;
  creatorUsd: number;
  grossUsd: number;
  platformUsd: number;
  agentId: string | null;
  transactionId: string;
  createdAt: string;
  agentName: string | null;
  agentSlug: string | null;
};

export type CreatorWalletSnapshot = {
  availableUsd: number;
  pendingUsd: number;
  totalEarnedUsd: number;
  totalWithdrawnUsd: number;
  salesCount: number;
  weeklySales: number;
  totalGrossUsd: number;
  creatorShareRate: number;
  platformShareRate: number;
  minWithdrawal: number;
};

export async function getCreatorWalletSnapshot(admin: Admin, userId: string): Promise<CreatorWalletSnapshot> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: salesCount }, { count: weeklySales }, { data: sumRows }, { data: wallet }] = await Promise.all([
    admin
      .from("creator_earnings")
      .select("id", { count: "exact", head: true })
      .eq("creator_user_id", userId)
      .eq("status", "settled"),
    admin
      .from("creator_earnings")
      .select("id", { count: "exact", head: true })
      .eq("creator_user_id", userId)
      .eq("status", "settled")
      .gte("created_at", weekAgo),
    admin.from("creator_earnings").select("creator_usd, gross_usd").eq("creator_user_id", userId).eq("status", "settled"),
    admin
      .from("creator_wallets")
      .select("available_usd, pending_usd, total_earned_usd, total_withdrawn_usd")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const totalEarnedFromRows = (sumRows ?? []).reduce((s, r) => s + Number(r.creator_usd), 0);
  const totalGross = (sumRows ?? []).reduce((s, r) => s + Number(r.gross_usd), 0);

  return {
    availableUsd: Number(wallet?.available_usd ?? 0),
    pendingUsd: Number(wallet?.pending_usd ?? 0),
    totalEarnedUsd: Number(wallet?.total_earned_usd ?? totalEarnedFromRows),
    totalWithdrawnUsd: Number(wallet?.total_withdrawn_usd ?? 0),
    salesCount: salesCount ?? 0,
    weeklySales: weeklySales ?? 0,
    totalGrossUsd: totalGross,
    creatorShareRate: CREATOR_SHARE_RATE,
    platformShareRate: PLATFORM_SHARE_RATE,
    minWithdrawal: MIN_CREATOR_WITHDRAWAL_USDT,
  };
}

export async function listCreatorEarnings(
  admin: Admin,
  userId: string,
  page: number,
  pageSize = EARNINGS_PAGE_SIZE
): Promise<{ rows: CreatorEarningRow[]; total: number; pages: number }> {
  const { count } = await admin
    .from("creator_earnings")
    .select("id", { count: "exact", head: true })
    .eq("creator_user_id", userId)
    .eq("status", "settled");

  const total = count ?? 0;
  const pages = totalPages(total, pageSize);
  const { from, to } = pageOffset(page, pageSize);

  const { data: earnings } = await admin
    .from("creator_earnings")
    .select("id, creator_usd, gross_usd, platform_usd, created_at, agent_id, transaction_id")
    .eq("creator_user_id", userId)
    .eq("status", "settled")
    .order("created_at", { ascending: false })
    .range(from, to);

  const agentIds = [...new Set((earnings ?? []).map((e) => e.agent_id).filter(Boolean))] as string[];
  let agentMap: Record<string, { name: string; slug: string }> = {};

  if (agentIds.length > 0) {
    const { data: agents } = await admin.from("agents").select("id, name, slug").in("id", agentIds);
    agentMap = Object.fromEntries((agents ?? []).map((a) => [a.id, { name: a.name, slug: a.slug }]));
  }

  const rows: CreatorEarningRow[] = (earnings ?? []).map((row) => {
    const agent = row.agent_id ? agentMap[row.agent_id] : null;
    return {
      id: row.id,
      creatorUsd: Number(row.creator_usd),
      grossUsd: Number(row.gross_usd),
      platformUsd: Number(row.platform_usd),
      agentId: row.agent_id,
      transactionId: row.transaction_id,
      createdAt: row.created_at,
      agentName: agent?.name ?? null,
      agentSlug: agent?.slug ?? null,
    };
  });

  return { rows, total, pages };
}

export async function listCreatorWithdrawals(
  admin: Admin,
  userId: string,
  limit = 20
): Promise<CreatorWithdrawalRow[]> {
  const { data } = await admin
    .from("creator_withdrawals")
    .select("id, amount_usd, status, payout_address, pay_currency, provider_payout_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((w) => ({
    id: w.id,
    amountUsd: Number(w.amount_usd),
    status: w.status,
    payoutAddress: w.payout_address,
    payCurrency: w.pay_currency,
    providerPayoutId: w.provider_payout_id,
    createdAt: w.created_at,
  }));
}
