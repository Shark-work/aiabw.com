import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const startedAt = Date.now();
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const admin = createSupabaseAdminClient();
  const [{ count: profilesCount, error: profilesError }, { count: agentsCount, error: agentsError }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("agents").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    ok: true,
    service: "admin-health",
    userId: auth.user.id,
    role: auth.profile?.role ?? null,
    timestamp: new Date().toISOString(),
    runtimeMs: Date.now() - startedAt,
    env: {
      hasAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    db: {
      profilesCount: profilesCount ?? null,
      agentsCount: agentsCount ?? null,
      profilesError: profilesError?.message ?? null,
      agentsError: agentsError?.message ?? null,
    },
  });
}
