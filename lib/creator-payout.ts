import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { MIN_CREATOR_WITHDRAWAL_USDT } from "@/lib/growth";
import { finalizeCreatorWithdrawalPayout, type PayoutWithdrawResult } from "@/lib/payout-withdraw";
import { isValidTronPayoutAddress, normalizeTronAddress } from "@/lib/tron-address";
import { recomputeCreatorWallets } from "@/lib/revenue-processor";

type Admin = SupabaseClient<Database>;

export async function ensureCreatorWalletRow(admin: Admin, userId: string) {
  await admin.from("creator_wallets").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
}

export async function getCreatorPayoutProfile(admin: Admin, userId: string) {
  await ensureCreatorWalletRow(admin, userId);
  const { data } = await admin
    .from("creator_wallets")
    .select("available_usd, pending_usd, total_earned_usd, total_withdrawn_usd, tron_payout_address, tron_bound_at")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    wallet: data ?? {
      available_usd: 0,
      pending_usd: 0,
      total_earned_usd: 0,
      total_withdrawn_usd: 0,
      tron_payout_address: null,
      tron_bound_at: null,
    },
    tronAddress: data?.tron_payout_address ?? null,
    tronBoundAt: data?.tron_bound_at ?? null,
    hasBoundTron: Boolean(data?.tron_payout_address),
  };
}

export async function bindCreatorTronAddress(
  admin: Admin,
  userId: string,
  addressInput: string
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const address = normalizeTronAddress(addressInput);
  if (!isValidTronPayoutAddress(address)) {
    return { ok: false, error: "请输入有效的 TRON 地址（USDT-TRC20，以 T 开头共 34 位）。" };
  }

  await ensureCreatorWalletRow(admin, userId);
  const { error } = await admin
    .from("creator_wallets")
    .update({
      tron_payout_address: address,
      tron_bound_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, address };
}

export async function requestCreatorWithdrawal(
  admin: Admin,
  userId: string,
  amountUsd: number,
  payoutAddressOverride?: string
): Promise<PayoutWithdrawResult> {
  if (!Number.isFinite(amountUsd) || amountUsd < MIN_CREATOR_WITHDRAWAL_USDT) {
    return {
      ok: false,
      error: `最低提现 ${MIN_CREATOR_WITHDRAWAL_USDT} USDT`,
      status: 400,
    };
  }

  const profile = await getCreatorPayoutProfile(admin, userId);
  const payoutAddress = payoutAddressOverride
    ? normalizeTronAddress(payoutAddressOverride)
    : profile.tronAddress;

  if (!payoutAddress) {
    return { ok: false, error: "请先绑定 TRON 钱包地址后再提现。", status: 400 };
  }

  if (!isValidTronPayoutAddress(payoutAddress)) {
    return { ok: false, error: "收款地址无效，请重新绑定 TRON 地址。", status: 400 };
  }

  await recomputeCreatorWallets(admin);
  const { data: wallet } = await admin
    .from("creator_wallets")
    .select("available_usd")
    .eq("user_id", userId)
    .maybeSingle();

  const available = Number(wallet?.available_usd ?? 0);
  if (amountUsd > available) {
    return { ok: false, error: "可用余额不足", status: 400 };
  }

  const withdrawalId = crypto.randomUUID();
  const { error: insertError } = await admin.from("creator_withdrawals").insert({
    id: withdrawalId,
    user_id: userId,
    amount_usd: amountUsd,
    payout_address: payoutAddress,
    pay_currency: "usdttrc20",
    status: "pending",
  });

  if (insertError) {
    return { ok: false, error: insertError.message, status: 500 };
  }

  return finalizeCreatorWithdrawalPayout(admin, {
    withdrawalId,
    userId,
    amountUsd,
    payoutAddress,
    availableBefore: available,
  });
}
