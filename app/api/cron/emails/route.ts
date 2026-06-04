import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { cronUnauthorized, verifyCronSecret } from "@/lib/cron-auth";
import { runAllEmailNotifications } from "@/lib/email-notifications";

export async function POST(req: Request) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const admin = createSupabaseAdminClient();
  const results = await runAllEmailNotifications(admin);

  return NextResponse.json({
    ok: true,
    ...results,
  });
}

export async function GET(req: Request) {
  return POST(req);
}
