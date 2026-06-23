import { NextResponse } from "next/server";
import { getQuestForToday } from "@/lib/daily-quests";

export const dynamic = "force-dynamic";

export async function GET() {
  const puzzle = await getQuestForToday();

  if (!puzzle) {
    return NextResponse.json({
      ok: true,
      message: "今日题目即将到来，请稍后再来",
      puzzle: null,
    });
  }

  return NextResponse.json({ ok: true, puzzle });
}
