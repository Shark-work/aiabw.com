import { NextResponse } from "next/server";
import { getTodayPuzzle, storePuzzle } from "@/lib/puzzle";

export async function GET() {
  const puzzle = await getTodayPuzzle();
  await storePuzzle(puzzle);

  return NextResponse.json({
    ok: true,
    puzzle,
  });
}
