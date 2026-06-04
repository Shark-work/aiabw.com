import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { settleTransactionRevenue } from "@/lib/settlement";

type Admin = SupabaseClient<Database>;

export async function grantUserAgent(
  admin: Admin,
  input: { userId: string; agentId: string; transactionId: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.from("user_agents").upsert(
    {
      user_id: input.userId,
      agent_id: input.agentId,
      transaction_id: input.transactionId,
      purchased_at: new Date().toISOString(),
    },
    { onConflict: "user_id,agent_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fulfillAgentPurchase(
  admin: Admin,
  input: {
    transaction: {
      id: string;
      user_id: string;
      agent_id: string | null;
      order_type: string;
      payment_status: string;
      price_amount: number;
      referral_code: string | null;
      inviter_user_id: string | null;
    };
    newPaymentStatus: string;
  }
): Promise<void> {
  const { transaction, newPaymentStatus } = input;
  if (transaction.order_type !== "agent" || !transaction.agent_id) return;

  const wasSuccess = isTerminalPaymentSuccess(transaction.payment_status);
  const isSuccess = isTerminalPaymentSuccess(newPaymentStatus);
  if (!isSuccess || wasSuccess) return;

  await grantUserAgent(admin, {
    userId: transaction.user_id,
    agentId: transaction.agent_id,
    transactionId: transaction.id,
  });

  await settleTransactionRevenue(admin, transaction, newPaymentStatus);
}

export function isTerminalPaymentSuccess(status: string): boolean {
  return status === "finished" || status === "confirmed" || status === "confirmed_finished";
}
