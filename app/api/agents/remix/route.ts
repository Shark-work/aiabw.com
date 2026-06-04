import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildRemixTemplate } from "@/lib/agent-remix";

export async function GET(req: Request) {
  const agentSlug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase();
  if (!agentSlug) {
    return NextResponse.json({ ok: false, error: "缺少 slug" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ ok: false, error: "请先登录后再 Remix" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: agent, error } = await admin
    .from("agents")
    .select("id, slug, name, description, prompt, system_prompt, metadata, category_id")
    .eq("slug", agentSlug)
    .eq("status", "active")
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !agent) {
    return NextResponse.json({ ok: false, error: "Agent 不存在或不可 Remix" }, { status: 404 });
  }

  let category: { slug: string } | null = null;
  if (agent.category_id) {
    const { data: cat } = await admin.from("categories").select("slug").eq("id", agent.category_id).maybeSingle();
    category = cat ? { slug: cat.slug } : null;
  }

  const template = buildRemixTemplate({ ...agent, category });

  return NextResponse.json({
    ok: true,
    template,
    editUrl: `/create?remix=${encodeURIComponent(agentSlug)}`,
  });
}
