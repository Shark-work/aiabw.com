import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildAgentPriceMetadata, parseAgentPriceUsdt } from "@/lib/creator-pricing";
import type { Json } from "@/types/database.types";

export const runtime = "nodejs";

type Body = {
  agentSlug?: string;
  priceUsdt?: number | string;
};

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return NextResponse.json({ ok: false, error: "请先登录。" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const agentSlug = body.agentSlug?.trim().toLowerCase();
    if (!agentSlug) {
      return NextResponse.json({ ok: false, error: "缺少 agentSlug。" }, { status: 400 });
    }

    const parsed = parseAgentPriceUsdt(body.priceUsdt);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: agent, error: fetchError } = await admin
      .from("agents")
      .select("id, slug, created_by, metadata")
      .eq("slug", agentSlug)
      .maybeSingle();

    if (fetchError || !agent) {
      return NextResponse.json({ ok: false, error: "Agent 不存在。" }, { status: 404 });
    }

    if (agent.created_by !== user.id) {
      return NextResponse.json({ ok: false, error: "仅可修改自己创建的 Agent 定价。" }, { status: 403 });
    }

    const metadata = buildAgentPriceMetadata(
      parsed.value,
      (agent.metadata ?? {}) as Record<string, unknown>
    );

    const { error: updateError } = await admin
      .from("agents")
      .update({ metadata: metadata as Json, updated_at: new Date().toISOString() })
      .eq("id", agent.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      slug: agent.slug,
      priceUsdt: parsed.value,
      free: parsed.free,
      message: parsed.free ? "已设为免费 Agent。" : `定价已更新为 ${parsed.value} USDT。`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "更新失败" },
      { status: 500 }
    );
  }
}
