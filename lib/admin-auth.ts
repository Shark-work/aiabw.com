import { NextResponse } from "next/server";

export function requireAdmin(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: "ADMIN_EMAIL is not configured" }, { status: 500 });
  }

  const currentEmail = request.headers.get("x-admin-email") ?? new URL(request.url).searchParams.get("email");
  if (!currentEmail || currentEmail.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
