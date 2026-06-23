import { NextResponse } from "next/server";
import { getTodayPuzzle } from "@/lib/puzzle";
import type { PuzzleAnswerResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { answerIndex?: number; date?: string }
    | null;

  if (typeof body?.answerIndex !== "number") {
    return NextResponse.json({ ok: false, error: "answerIndex is required" }, { status: 400 });
  }

  const puzzle = await getTodayPuzzle();
  const correct = body.answerIndex === puzzle.correctAnswerIndex;

  const result: PuzzleAnswerResult = {
    correct,
    correctAnswerIndex: puzzle.correctAnswerIndex,
    correctAnswerText: puzzle.options[puzzle.correctAnswerIndex]?.text ?? "",
    explanation: correct ? "答对了！你成功解开了今天的谜题。" : "再试一次，注意故事里的关键线索。",
  };

  return NextResponse.json({ ok: true, result });
}
