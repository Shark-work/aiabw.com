import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultSettings = {
  site_name: "AIABW · 艾比世界",
  site_url: "https://aiabw.com",
  default_language: "zh-CN",
  payment_provider: "NOWPayments",
  ga4_id: "G-11LB54EX3D",
};

async function requireAdmin() {
  return requireAdminApi();
}

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const client = createSupabaseAdminClient();
  const { data, error } = await client.from("site_settings").select("key, value");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const config = { ...defaultSettings };
  for (const row of data ?? []) {
    if (row.key in config) {
      (config as Record<string, string>)[row.key] = String(row.value ?? "");
    }
  }

  return NextResponse.json({ ok: true, config });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const body = (await req.json()) as Partial<typeof defaultSettings>;
  const config = { ...defaultSettings, ...body };

  const client = createSupabaseAdminClient();
  const rows = Object.entries(config).map(([key, value]) => ({ key, value: String(value) }));

  const { error } = await client.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, config });
}
