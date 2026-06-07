import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MIN_REFERRAL_WITHDRAWAL_USDT, recomputeReferralWalletForUser } from "@/lib/referral-wallet";
import { submitNowPaymentsWithdrawal } from "@/lib/payout-withdraw";
import { isValidTronPayoutAddress, normalizeTronAddress } from "@/lib/tron-address";

export async function POST(req: Request) {
  const body = (await req.json()) as { amountUsd?: number; payoutAddress?: string; payCurrency?: string };
  const amountUsd = Number(body.amountUsd);
  const payoutAddress = body.payoutAddress?.trim();
  const payCurrency = body.payCurrency ?? "usdttrc20";

  if (!payoutAddress) {
    return NextResponse.json({ ok: false, error: "请填写 TRON (USDT-TRC20) 收款地址" }, { status: 400 });
  }

  if (!isValidTronPayoutAddress(payoutAddress)) {
    return NextResponse.json({ ok: false, error: "请输入有效的 TRON 地址（以 T 开头共 34 位）" }, { status: 400 });
  }

  const tronAddress = normalizeTronAddress(payoutAddress);

  if (!Number.isFinite(amountUsd) || amountUsd < MIN_REFERRAL_WITHDRAWAL_USDT) {
    return NextResponse.json(
      { ok: false, error: `邀请佣金最低提现 ${MIN_REFERRAL_WITHDRAWAL_USDT} USDT` },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const wallet = await recomputeReferralWalletForUser(admin, user.id);

  if (amountUsd > wallet.available) {
    return NextResponse.json({ ok: false, error: "可提现余额不足" }, { status: 400 });
  }

  const withdrawalId = crypto.randomUUID();
  const { error: insertError } = await admin.from("referral_withdrawals").insert({
    id: withdrawalId,
    user_id: user.id,
    amount_usd: amountUsd,
    payout_address: tronAddress,
    pay_currency: payCurrency,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  const { providerRef, raw, payoutFailed } = await submitNowPaymentsWithdrawal({
    withdrawalId,
    payoutAddress: tronAddress,
    amountUsd,
    payCurrency,
    extraIdPrefix: "ref_",
  });

  if (payoutFailed) {
    await admin
      .from("referral_withdrawals")
      .update({ status: "failed", raw })
      .eq("id", withdrawalId);
  } else {
    await admin
      .from("referral_withdrawals")
      .update({
        status: "processing",
        provider_payout_id: providerRef,
        raw,
      })
      .eq("id", withdrawalId);
  }

  await recomputeReferralWalletForUser(admin, user.id);

  return NextResponse.json({
    ok: true,
    withdrawalId,
    providerRef,
    message: "邀请佣金提现申请已提交",
  });
}
