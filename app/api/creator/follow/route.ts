import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isFollowingCreator, toggleCreatorFollow } from "@/lib/social";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const creatorUserId = new URL(req.url).searchParams.get("creatorUserId")?.trim();
  if (!creatorUserId) {
    return NextResponse.json({ ok: false, error: "缺少 creatorUserId" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const following = await isFollowingCreator(admin, user.id, creatorUserId);

  return NextResponse.json({ ok: true, following, canFollow: user.id !== creatorUserId });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { creatorUserId?: string; following?: boolean };
  const creatorUserId = body.creatorUserId?.trim();
  if (!creatorUserId) {
    return NextResponse.json({ ok: false, error: "缺少 creatorUserId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: creator } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", creatorUserId)
    .maybeSingle();

  if (!creator) {
    return NextResponse.json({ ok: false, error: "创作者不存在" }, { status: 404 });
  }

  const wantFollow = body.following !== false;
  const result = await toggleCreatorFollow(admin, user.id, creatorUserId, wantFollow);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    following: result.following,
    message: result.following ? "已关注创作者" : "已取消关注",
  });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { creatorUserId?: string };
  const creatorUserId = body.creatorUserId?.trim();
  if (!creatorUserId) {
    return NextResponse.json({ ok: false, error: "缺少 creatorUserId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await toggleCreatorFollow(admin, user.id, creatorUserId, false);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, following: false, message: "已取消关注" });
}
