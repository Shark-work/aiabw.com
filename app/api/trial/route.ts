import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { getCachedAgentPrompt, getCachedChatResponse, setCachedChatResponse } from "@/lib/chat-cache";
import {
  checkChatRateLimitDistributed,
  checkChatRateLimitMemory,
  checkDuplicateSpam,
  getClientIp,
} from "@/lib/chat-rate-limit";
import { checkDailyLlmLimits, recordLlmUsage } from "@/lib/llm-cost";
import { buildAgentSystemPrompt, callLlmForTier } from "@/lib/llm";
import { LLM_TIER_LABELS, resolveTier } from "@/lib/llm-tier";
import { moderateTextCombined, sanitizeOutput } from "@/lib/moderation";
import { checkAndConsumeTrialQuota, getTrialQuotaStatus } from "@/lib/trial-quota";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HISTORY = 12;
const MAX_MESSAGE_LEN = 2000;

type HistoryItem = { role: string; content: string };

function parseHistory(raw: unknown): HistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is HistoryItem => {
      if (!m || typeof m !== "object") return false;
      const item = m as HistoryItem;
      return (
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length > 0
      );
    })
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) }));
}

function chatPayload(extra: Record<string, unknown>) {
  return extra;
}

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const url = new URL(req.url);
  const agentSlug = url.searchParams.get("agentSlug")?.trim().toLowerCase();
  if (!agentSlug) {
    return NextResponse.json({ ok: false, error: "缺少 agentSlug" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id")
    .eq("slug", agentSlug)
    .eq("status", "active")
    .eq("visibility", "public")
    .maybeSingle();

  if (!agent) {
    return NextResponse.json({ ok: false, error: "Agent 不存在" }, { status: 404 });
  }

  const status = await getTrialQuotaStatus(admin, user.id, agent.id);
  const tier = resolveTier(status.isPro, status.ownsAgent);

  return NextResponse.json({
    ok: true,
    remaining: status.remaining,
    limit: status.limit,
    isPro: status.isPro,
    ownsAgent: status.ownsAgent,
    unlimited: status.isPro || status.ownsAgent,
    llmTier: tier,
    llmModelLabel: LLM_TIER_LABELS[tier],
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "请先登录后再试用聊天。", requireLogin: true },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      agentSlug?: string;
      message?: string;
      history?: unknown;
    };

    const agentSlug = body.agentSlug?.trim().toLowerCase();
    const message = body.message?.trim() ?? "";

    if (!agentSlug) {
      return NextResponse.json({ ok: false, error: "缺少 agentSlug" }, { status: 400 });
    }

    if (!message || message.length > MAX_MESSAGE_LEN) {
      return NextResponse.json({ ok: false, error: "消息无效或过长" }, { status: 400 });
    }

    const moderation = await moderateTextCombined(message);
    if (!moderation.allowed) {
      return NextResponse.json({ ok: false, error: moderation.reason }, { status: 400 });
    }

    const ip = getClientIp(req);
    const admin = createSupabaseAdminClient();

    const agentMeta = await getCachedAgentPrompt(admin, agentSlug, async () => {
      const { data: row } = await admin
        .from("agents")
        .select("id, name, description, system_prompt, prompt, temperature, status, visibility")
        .eq("slug", agentSlug)
        .eq("status", "active")
        .eq("visibility", "public")
        .maybeSingle();

      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        systemPrompt: buildAgentSystemPrompt(row),
        temperature: Number(row.temperature) || 0.7,
      };
    });

    if (!agentMeta) {
      return NextResponse.json({ ok: false, error: "Agent 不存在或已下架" }, { status: 404 });
    }

    const quotaPreview = await getTrialQuotaStatus(admin, user.id, agentMeta.id);
    const isProOrOwner = quotaPreview.isPro || quotaPreview.ownsAgent;

    const memLimit = checkChatRateLimitMemory(user.id, ip, isProOrOwner);
    if (!memLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: memLimit.reason, retryAfterSec: memLimit.retryAfterSec },
        { status: 429 }
      );
    }

    const distLimit = await checkChatRateLimitDistributed(admin, ip);
    if (!distLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: distLimit.reason, retryAfterSec: distLimit.retryAfterSec },
        { status: 429 }
      );
    }

    const dupLimit = checkDuplicateSpam(user.id, agentSlug, message);
    if (!dupLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: dupLimit.reason, retryAfterSec: dupLimit.retryAfterSec },
        { status: 429 }
      );
    }

    const history = parseHistory(body.history);
    const tier = resolveTier(quotaPreview.isPro, quotaPreview.ownsAgent);

    const cachedReply = await getCachedChatResponse(admin, agentSlug, message, history);
    if (cachedReply) {
      const quotaStatus = await getTrialQuotaStatus(admin, user.id, agentMeta.id);
      return NextResponse.json({
        ok: true,
        data: chatPayload({ reply: cachedReply, cached: true, llmTier: tier, model: LLM_TIER_LABELS[tier] }),
        remaining: quotaStatus.remaining,
        limit: quotaStatus.limit,
        isPro: quotaStatus.isPro,
        ownsAgent: quotaStatus.ownsAgent,
        unlimited: isProOrOwner,
        llmTier: tier,
        llmModelLabel: LLM_TIER_LABELS[tier],
      });
    }

    const dailyLimit = await checkDailyLlmLimits(admin, user.id, tier);
    if (!dailyLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: dailyLimit.reason,
          quotaExceeded: tier === "free",
          requireUpgrade: tier === "free",
          dailyStats: dailyLimit.stats,
        },
        { status: 429 }
      );
    }

    const quota = await checkAndConsumeTrialQuota(admin, user.id, agentMeta.id);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: quota.reason,
          quotaExceeded: true,
          remaining: 0,
          limit: quota.limit,
          isPro: quota.isPro,
          requireUpgrade: !quota.isPro,
        },
        { status: 403 }
      );
    }

    const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: agentMeta.systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const llm = await callLlmForTier(tier, llmMessages);
    const reply = sanitizeOutput(llm.reply);

    await setCachedChatResponse(admin, agentSlug, message, history, reply);

    const { costUsd } = await recordLlmUsage(admin, {
      userId: user.id,
      agentId: agentMeta.id,
      tier,
      model: llm.model,
      provider: llm.provider,
      promptTokens: llm.promptTokens ?? 0,
      completionTokens: llm.completionTokens ?? 0,
      latencyMs: llm.latencyMs ?? 0,
      raw: {
        ip_hash: ip.slice(0, 8),
        message_len: message.length,
        cached: false,
      } as Json,
    });

    return NextResponse.json({
      ok: true,
      data: chatPayload({
        reply,
        provider: llm.provider,
        model: llm.model,
        llmTier: tier,
        modelLabel: LLM_TIER_LABELS[tier],
        costUsd,
        latencyMs: llm.latencyMs,
      }),
      remaining: quota.remaining,
      limit: quota.limit,
      isPro: quota.isPro,
      ownsAgent: quota.ownsAgent,
      unlimited: quota.isPro || quota.ownsAgent,
      llmTier: tier,
      llmModelLabel: LLM_TIER_LABELS[tier],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "聊天服务暂时不可用" },
      { status: 500 }
    );
  }
}
