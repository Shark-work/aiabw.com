import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAgentFavorited, listUserFavoriteAgents, toggleAgentFavorite } from "@/lib/social";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const agentSlug = searchParams.get("agentSlug")?.trim();

  const admin = createSupabaseAdminClient();

  if (agentSlug) {
    const { data: agent } = await admin.from("agents").select("id").eq("slug", agentSlug).maybeSingle();
    if (!agent) {
      return NextResponse.json({ ok: false, error: "Agent 不存在" }, { status: 404 });
    }
    const favorited = await isAgentFavorited(admin, user.id, agent.id);
    return NextResponse.json({ ok: true, favorited, agentId: agent.id });
  }

  const favorites = await listUserFavoriteAgents(admin, user.id);
  return NextResponse.json({ ok: true, favorites, count: favorites.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { agentSlug?: string; favorited?: boolean };
  const agentSlug = body.agentSlug?.trim();
  if (!agentSlug) {
    return NextResponse.json({ ok: false, error: "缺少 agentSlug" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id")
    .eq("slug", agentSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return NextResponse.json({ ok: false, error: "Agent 不存在" }, { status: 404 });
  }

  const wantFavorite = body.favorited !== false;
  const result = await toggleAgentFavorite(admin, user.id, agent.id, wantFavorite);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    favorited: result.favorited,
    message: result.favorited ? "已收藏" : "已取消收藏",
  });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { agentSlug?: string };
  const agentSlug = body.agentSlug?.trim();
  if (!agentSlug) {
    return NextResponse.json({ ok: false, error: "缺少 agentSlug" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: agent } = await admin.from("agents").select("id").eq("slug", agentSlug).maybeSingle();
  if (!agent) {
    return NextResponse.json({ ok: false, error: "Agent 不存在" }, { status: 404 });
  }

  const result = await toggleAgentFavorite(admin, user.id, agent.id, false);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, favorited: false, message: "已取消收藏" });
}
