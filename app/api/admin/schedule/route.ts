import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getWeeklySchedule, upsertWeeklySchedule } from "@/lib/admin-db";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  const schedule = await getWeeklySchedule();
  return NextResponse.json({ ok: true, schedule });
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const body = await request.json().catch(() => null);
  if (typeof body?.dayOfWeek !== "number" || body.dayOfWeek < 1 || body.dayOfWeek > 7) {
    return NextResponse.json({ ok: false, error: "dayOfWeek must be 1-7" }, { status: 400 });
  }

  const schedule = await upsertWeeklySchedule(body.dayOfWeek, body.topicId ?? null);
  return NextResponse.json({ ok: true, schedule });
}
