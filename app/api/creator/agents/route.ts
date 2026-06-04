import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAgentPriceUsdt, isAgentFree } from "@/lib/products";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: agents, error } = await admin
    .from("agents")
    .select("slug, name, status, metadata")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (agents ?? []).map((a) => {
    const metadata = (a.metadata ?? {}) as Record<string, unknown>;
    return {
      slug: a.slug,
      name: a.name,
      status: a.status,
      priceUsdt: isAgentFree(metadata) ? 0 : getAgentPriceUsdt(metadata),
    };
  });

  return NextResponse.json({ ok: true, agents: rows });
}
