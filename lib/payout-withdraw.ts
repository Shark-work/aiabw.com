import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { createNowPaymentsPayout } from "@/lib/nowpayments";

export const CREATOR_PAYOUT_CURRENCY = "usdttrc20";

type Admin = SupabaseClient<Database>;

export type PayoutWithdrawResult = {
  ok: true;
  withdrawalId: string;
  providerRef: string | null;
  message: string;
} | {
  ok: false;
  error: string;
  status?: number;
};

export async function submitNowPaymentsWithdrawal(input: {
  withdrawalId: string;
  payoutAddress: string;
  amountUsd: number;
  payCurrency?: string;
  extraIdPrefix?: string;
}): Promise<{ providerRef: string | null; raw: Json; payoutFailed: boolean; errorMessage?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const payCurrency = input.payCurrency ?? CREATOR_PAYOUT_CURRENCY;
  const extraId = input.extraIdPrefix
    ? `${input.extraIdPrefix}${input.withdrawalId}`
    : input.withdrawalId;

  try {
    const payout = await createNowPaymentsPayout({
      address: input.payoutAddress,
      currency: payCurrency,
      amount: input.amountUsd,
      ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
      extra_id: extraId,
      payout_description: `AIABW withdrawal ${input.withdrawalId}`,
    });

    const providerRef = payout.id ?? payout.withdrawals?.[0]?.id ?? null;
    return { providerRef, raw: payout as Json, payoutFailed: false };
  } catch (error) {
    return {
      providerRef: null,
      raw: { error: error instanceof Error ? error.message : "payout_failed" } as Json,
      payoutFailed: true,
      errorMessage: error instanceof Error ? error.message : "NOWPayments 打款失败",
    };
  }
}

export async function finalizeCreatorWithdrawalPayout(
  admin: Admin,
  input: {
    withdrawalId: string;
    userId: string;
    amountUsd: number;
    payoutAddress: string;
    availableBefore: number;
  }
): Promise<PayoutWithdrawResult> {
  const { providerRef, raw, payoutFailed } = await submitNowPaymentsWithdrawal({
    withdrawalId: input.withdrawalId,
    payoutAddress: input.payoutAddress,
    amountUsd: input.amountUsd,
    extraIdPrefix: "cr_",
  });

  if (payoutFailed) {
    await admin
      .from("creator_withdrawals")
      .update({ status: "failed", raw })
      .eq("id", input.withdrawalId);

    return { ok: false, error: "自动打款失败，请稍后重试或联系客服。", status: 502 };
  }

  await admin
    .from("creator_withdrawals")
    .update({
      status: "processing",
      provider_payout_id: providerRef,
      raw,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.withdrawalId);

  await admin
    .from("creator_wallets")
    .update({
      available_usd: Math.max(0, input.availableBefore - input.amountUsd),
      pending_usd: input.amountUsd,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId);

  return {
    ok: true,
    withdrawalId: input.withdrawalId,
    providerRef,
    message: "提现已提交，NOWPayments 正在向你的 TRON 地址打款",
  };
}
