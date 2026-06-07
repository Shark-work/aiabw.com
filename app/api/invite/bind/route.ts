import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { bindInviteRelationship } from "@/lib/referral";

export async function POST(req: Request) {
  const body = (await req.json()) as { inviteCode?: string };
  const inviteCode = body.inviteCode?.trim();

  if (!inviteCode) {
    return NextResponse.json({ ok: false, error: "Missing inviteCode" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await bindInviteRelationship(admin, user.id, inviteCode);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true, inviterUserId: result.inviterUserId });
}
