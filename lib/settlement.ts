import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  processPendingRevenueEvents,
  recomputeCreatorWallets,
  recomputeReferralStatsCache,
  recomputeReferralWallets,
  recordRevenueEvent,
} from "@/lib/revenue-processor";
import { getInviterForUser, resolveInviteCode } from "@/lib/referral";
import { isTerminalPaymentSuccess } from "@/lib/purchases";

type Admin = SupabaseClient<Database>;

type PayableTransaction = {
  id: string;
  user_id: string;
  order_type: string;
  agent_id: string | null;
  payment_status: string;
  price_amount: number;
  referral_code: string | null;
  inviter_user_id: string | null;
  plan_slug?: string;
};

/** 支付成功时记录收入事件并结算邀请 10% 佣金 */
export async function settleTransactionRevenue(
  admin: Admin,
  transaction: PayableTransaction,
  newPaymentStatus: string
): Promise<void> {
  const wasSuccess = isTerminalPaymentSuccess(transaction.payment_status);
  const isSuccess = isTerminalPaymentSuccess(newPaymentStatus);
  if (!isSuccess || wasSuccess) return;

  const gross = Number(transaction.price_amount);
  if (gross <= 0) return;

  let inviterUserId = transaction.inviter_user_id;
  if (!inviterUserId && transaction.referral_code) {
    inviterUserId = await resolveInviteCode(admin, transaction.referral_code);
  }
  if (!inviterUserId) {
    inviterUserId = await getInviterForUser(admin, transaction.user_id);
  }

  const eventType =
    transaction.order_type === "agent"
      ? "agent_purchase"
      : transaction.order_type === "subscription"
        ? "subscription"
        : "payment";

  await recordRevenueEvent(admin, {
    transactionId: transaction.id,
    eventType,
    grossUsd: gross,
    buyerUserId: transaction.user_id,
    agentId: transaction.agent_id,
    referralCode: transaction.referral_code,
    inviterUserId,
  });

  await processPendingRevenueEvents(admin, 30);
  await recomputeCreatorWallets(admin);
  await recomputeReferralWallets(admin);

  if (inviterUserId) {
    await recomputeReferralStatsCache(admin, inviterUserId);
  }
}
