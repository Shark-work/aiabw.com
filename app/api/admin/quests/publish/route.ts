import { NextResponse } from "next/server";
import { publishTodayDraft } from "@/lib/daily-quests";

export const dynamic = "force-dynamic";

export async function PUT() {
  const result = await publishTodayDraft();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
