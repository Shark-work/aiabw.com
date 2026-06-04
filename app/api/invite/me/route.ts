import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getReferralDashboard } from "@/lib/referral-wallet";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dashboard = await getReferralDashboard(admin, user.id, appUrl);

  return NextResponse.json({
    ok: true,
    code: dashboard.code,
    inviteLink: dashboard.inviteLink,
    stats: {
      inviteCount: dashboard.inviteCount,
      totalCommissionUsd: dashboard.totalCommissionUsd,
      availableUsd: dashboard.availableUsd,
      pendingUsd: dashboard.pendingUsd,
      totalWithdrawnUsd: dashboard.totalWithdrawnUsd,
      commissionRate: dashboard.commissionRate,
      updatedAt: dashboard.updatedAt,
    },
    invitees: dashboard.invitees,
    commissions: dashboard.commissions,
  });
}
