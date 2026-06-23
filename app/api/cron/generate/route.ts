import { NextResponse } from "next/server";
import { generateAndStoreDraftForToday } from "@/lib/daily-quests";

export const dynamic = "force-dynamic";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export async function POST() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, skipped: true, date: new Date().toISOString().slice(0, 10), stage: "database", error: "DATABASE_URL is missing" },
      { status: 200 },
    );
  }

  const result = await generateAndStoreDraftForToday();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
