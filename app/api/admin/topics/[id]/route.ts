import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateTopic } from "@/lib/admin-db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const body = await request.json().catch(() => null);
  const topic = await updateTopic(params.id, {
    name: body?.name,
    slug: body?.slug,
    description: body?.description,
    promptTemplate: body?.promptTemplate,
    icon: body?.icon,
    sortOrder: typeof body?.sortOrder === "number" ? body.sortOrder : undefined,
    isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
  });

  if (!topic) {
    return NextResponse.json({ ok: false, error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, topic });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return PUT(request, { params });
}
