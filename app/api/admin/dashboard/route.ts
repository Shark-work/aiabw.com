import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { fetchAdminDashboard } from "@/lib/admin-analytics";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const admin = createSupabaseAdminClient();
  const data = await fetchAdminDashboard(admin);
  return NextResponse.json({ ok: true, data });
}
