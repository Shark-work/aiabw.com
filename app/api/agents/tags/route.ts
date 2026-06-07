import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchAllPublicTags } from "@/lib/search";

export async function GET() {
  const admin = createSupabaseAdminClient();
  const tags = await fetchAllPublicTags(admin);
  return NextResponse.json(
    { ok: true, tags },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
  );
}
