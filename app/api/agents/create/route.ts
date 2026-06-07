import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildAgentPriceMetadata, formatCreatorShareLabel, parseAgentPriceUsdt } from "@/lib/creator-pricing";
import { moderateAgentCreation } from "@/lib/moderation";
import { userHasActivePro } from "@/lib/trial-quota";
import type { Json } from "@/types/database.types";

export const runtime = "nodejs";

const CATEGORY_SLUGS = new Set(["companion", "story-universe", "adventure", "meme", "game"]);

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `agent-${suffix}`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return NextResponse.json({ ok: false, error: "请先登录后再创建 Agent。" }, { status: 401 });
    }

    const body = (await req.json()) as {
      name?: string;
      description?: string;
      prompt?: string;
      style?: string;
      categorySlug?: string;
      publish?: boolean;
      priceUsdt?: number | string;
      remixSourceSlug?: string;
    };

    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const prompt = body.prompt?.trim() ?? "";
    const style = body.style?.trim() ?? "";
    const categorySlug = (body.categorySlug ?? "companion").trim().toLowerCase();
    const publish = body.publish === true;

    if (!name || name.length < 2) {
      return NextResponse.json({ ok: false, error: "请填写至少 2 个字的角色名称。" }, { status: 400 });
    }

    if (!description || description.length < 10) {
      return NextResponse.json({ ok: false, error: "请填写至少 10 字的角色简介。" }, { status: 400 });
    }

    if (!prompt || prompt.length < 20) {
      return NextResponse.json({ ok: false, error: "请填写至少 20 字的角色 Prompt。" }, { status: 400 });
    }

    if (!CATEGORY_SLUGS.has(categorySlug)) {
      return NextResponse.json({ ok: false, error: "无效的分类。" }, { status: 400 });
    }

    const priceParsed = parseAgentPriceUsdt(body.priceUsdt);
    if (!priceParsed.ok) {
      return NextResponse.json({ ok: false, error: priceParsed.error }, { status: 400 });
    }

    const moderation = await moderateAgentCreation({ name, description, prompt, style });
    if (!moderation.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: moderation.reason,
          moderationFailed: true,
          categories: moderation.categories,
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    await admin.from("profiles").upsert(
      { user_id: user.id, language: "zh-CN", is_creator: true },
      { onConflict: "user_id", ignoreDuplicates: false }
    );

    const isPro = await userHasActivePro(admin, user.id);

    const { data: category } = await admin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    const slug = slugify(name);
    const systemPrompt = `${prompt}\n\n你是「${name}」。${description}\n用中文回复，保持角色一致。`;

    const remixSourceSlug = body.remixSourceSlug?.trim().toLowerCase() || null;
    let remixMeta: Record<string, unknown> = {};
    if (remixSourceSlug) {
      const { data: source } = await admin
        .from("agents")
        .select("id, slug, name, created_by")
        .eq("slug", remixSourceSlug)
        .eq("status", "active")
        .maybeSingle();
      if (source) {
        remixMeta = {
          remixed_from: {
            slug: source.slug,
            name: source.name,
            agent_id: source.id,
            creator_id: source.created_by,
            at: new Date().toISOString(),
          },
        };
      }
    }

    const metadata = buildAgentPriceMetadata(priceParsed.value, {
      pillar: categorySlug,
      style,
      created_via: remixSourceSlug ? "user_remix" : "user_create",
      moderation: "qwen_passed",
      tags: [categorySlug],
      pricing_note: formatCreatorShareLabel(),
      ...remixMeta,
    });

    const { data: agent, error: insertError } = await admin
      .from("agents")
      .insert({
        slug,
        name,
        description,
        prompt: style ? `${categorySlug} · ${style}` : categorySlug,
        system_prompt: systemPrompt,
        status: publish ? "active" : "draft",
        visibility: publish ? "public" : "private",
        category_id: category?.id ?? null,
        created_by: user.id,
        metadata: metadata as Json,
      })
      .select("id, slug, name, status, visibility")
      .single();

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    if (publish && style) {
      const tags = style
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .slice(0, 5);
      for (const tag of tags) {
        await admin.from("agent_tags").insert({ agent_id: agent.id, tag }).then(() => undefined);
      }
    }

    await admin
      .from("profiles")
      .update({ is_creator: true })
      .eq("user_id", user.id);

    if (publish) {
      const { notifyFollowersOfNewAgent } = await import("@/lib/email-notifications");
      void notifyFollowersOfNewAgent(admin, {
        agentId: agent.id,
        agentSlug: agent.slug,
        agentName: agent.name,
        creatorUserId: user.id,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      ok: true,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        status: agent.status,
        visibility: agent.visibility,
        url: publish ? `/agents/${agent.slug}` : null,
      },
      priceUsdt: priceParsed.value,
      free: priceParsed.free,
      isPro,
      message: publish
        ? "Agent 已通过内容审核并发布！"
        : "Agent 已通过内容审核，已保存为草稿。",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "创建失败" },
      { status: 500 }
    );
  }
}
