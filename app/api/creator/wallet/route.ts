import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  bindCreatorTronAddress,
  getCreatorPayoutProfile,
  requestCreatorWithdrawal,
} from "@/lib/creator-payout";
import { CREATOR_SHARE_RATE, MIN_CREATOR_WITHDRAWAL_USDT, PLATFORM_SHARE_RATE } from "@/lib/growth";
import { maskTronAddress } from "@/lib/tron-address";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const profile = await getCreatorPayoutProfile(admin, user.id);

  const { data: earnings } = await admin
    .from("creator_earnings")
    .select("creator_usd, created_at, agent_id")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: withdrawals } = await admin
    .from("creator_withdrawals")
    .select("id, amount_usd, status, created_at, payout_address, provider_payout_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const tron = profile.tronAddress;

  return NextResponse.json({
    ok: true,
    wallet: profile.wallet,
    tronAddress: tron,
    tronAddressMasked: tron ? maskTronAddress(tron) : null,
    tronBoundAt: profile.tronBoundAt,
    hasBoundTron: profile.hasBoundTron,
    recentEarnings: earnings ?? [],
    recentWithdrawals: withdrawals ?? [],
    minWithdrawal: MIN_CREATOR_WITHDRAWAL_USDT,
    creatorShareRate: CREATOR_SHARE_RATE,
    platformShareRate: PLATFORM_SHARE_RATE,
  });
}

/** 绑定 TRON (USDT-TRC20) 收款地址 */
export async function PUT(req: Request) {
  const body = (await req.json()) as { tronAddress?: string };
  const tronAddress = body.tronAddress?.trim();

  if (!tronAddress) {
    return NextResponse.json({ ok: false, error: "请填写 TRON 钱包地址" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await bindCreatorTronAddress(admin, user.id, tronAddress);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tronAddress: result.address,
    tronAddressMasked: maskTronAddress(result.address),
    message: "TRON 钱包已绑定，可用于 USDT 提现",
  });
}

/** 申请提现（≥10 USDT，使用已绑定地址，NOWPayments Payout 自动打款） */
export async function POST(req: Request) {
  const body = (await req.json()) as { amountUsd?: number; payoutAddress?: string };
  const amountUsd = Number(body.amountUsd);

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await requestCreatorWithdrawal(
    admin,
    user.id,
    amountUsd,
    body.payoutAddress?.trim()
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    ok: true,
    withdrawalId: result.withdrawalId,
    providerRef: result.providerRef,
    message: result.message,
  });
}
