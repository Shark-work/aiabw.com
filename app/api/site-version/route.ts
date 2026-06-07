import { NextResponse } from "next/server";
import { CURRENT_SITE_VERSION, SITE_VERSION_HISTORY } from "@/lib/site-version";

export async function GET() {
  return NextResponse.json({
    ok: true,
    currentVersion: CURRENT_SITE_VERSION,
    history: SITE_VERSION_HISTORY,
  });
}
