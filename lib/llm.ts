type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

import {
  ANTHROPIC_MODEL_FREE,
  ANTHROPIC_MODEL_PRO,
  type LlmUserTier,
  resolveModelForTier,
} from "@/lib/llm-tier";

export type LlmResponse = {
  reply: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
};

const DEFAULT_SYSTEM_TAIL =
  "用中文回复，保持角色一致性，语气梦幻赛博。每次回复 2-5 句，适合互动与冒险。";

/** 按用户层级调用 Anthropic：免费 Haiku，Pro Sonnet */
export async function callLlmForTier(
  tier: LlmUserTier,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = resolveModelForTier(tier);

  if (!apiKey) {
    return mockLlmResponse(messages, tier, model);
  }

  const started = Date.now();
  const result = await callAnthropic(messages, apiKey, model);
  return { ...result, latencyMs: Date.now() - started };
}

/** @deprecated 使用 callLlmForTier */
export async function callLlm(messages: ChatMessage[]): Promise<LlmResponse> {
  return callLlmForTier("free", messages);
}

export function buildAgentSystemPrompt(agent: {
  name: string;
  description: string;
  system_prompt: string | null;
  prompt: string | null;
}): string {
  const base =
    agent.system_prompt?.trim() ||
    agent.prompt?.trim() ||
    `你是「${agent.name}」，AIABW 艾比世界的 AI Agent。${agent.description}`;
  return `${base}\n\n${DEFAULT_SYSTEM_TAIL}`;
}

function mockLlmResponse(messages: ChatMessage[], tier: LlmUserTier, model: string): LlmResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const label = tier === "pro" ? "Sonnet" : "Haiku";
  return {
    reply: `（演示模式 · 请配置 ANTHROPIC_API_KEY · ${label}）\n\n收到：「${lastUser.slice(0, 80)}」\n\n${DEFAULT_SYSTEM_TAIL}`,
    provider: "mock",
    model,
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: 0,
  };
}

async function callAnthropic(
  messages: ChatMessage[],
  apiKey: string,
  model: string
): Promise<LlmResponse> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const chatMessages = messages.filter((m) => m.role !== "system");
  const maxTokens = model.includes("sonnet") ? 1536 : 1024;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: chatMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  const json = (await res.json()) as {
    content?: Array<{ text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Anthropic error ${res.status}`);
  }

  return {
    reply: json.content?.[0]?.text?.trim() ?? "…",
    provider: "anthropic",
    model,
    promptTokens: json.usage?.input_tokens,
    completionTokens: json.usage?.output_tokens,
  };
}

export { ANTHROPIC_MODEL_FREE, ANTHROPIC_MODEL_PRO };
