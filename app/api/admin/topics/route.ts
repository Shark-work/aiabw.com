import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createTopic, getAllTopics } from "@/lib/admin-db";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const topics = await getAllTopics();
  const activeOnly = new URL(request.url).searchParams.get("active") === "true";
  return NextResponse.json({ ok: true, topics: activeOnly ? topics.filter((topic) => topic.is_active) : topics });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.slug) {
    return NextResponse.json({ ok: false, error: "name and slug are required" }, { status: 400 });
  }

  const topic = await createTopic({
    name: body.name,
    slug: body.slug,
    description: body.description ?? null,
    promptTemplate: body.promptTemplate ?? null,
    icon: body.icon ?? "🧩",
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    isActive: body.isActive ?? true,
  });

  return NextResponse.json({ ok: true, topic }, { status: 201 });
}
