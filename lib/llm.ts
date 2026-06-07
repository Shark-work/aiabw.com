type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL_FREE,
  QWEN_BASE_URL,
  QWEN_MODEL_PRO,
  type LlmUserTier,
  resolveModelForTier,
  resolveProviderForTier,
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

const MAX_LLM_RETRIES = 2;
const RETRY_BASE_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

function isRetryableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("429") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504")
  );
}

async function withLlmRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_LLM_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_LLM_RETRIES && isRetryableError(error)) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/** 按用户层级调用：免费 DeepSeek，Pro 通义千问 */
export async function callLlmForTier(
  tier: LlmUserTier,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  const model = resolveModelForTier(tier);
  const provider = resolveProviderForTier(tier);

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) return mockLlmResponse(messages, tier, model);
    const started = Date.now();
    const result = await withLlmRetry(() =>
      callOpenAICompatible(DEEPSEEK_BASE_URL, apiKey, model, messages, {
        maxTokens: 1024,
        provider: "deepseek",
      })
    );
    return { ...result, latencyMs: Date.now() - started };
  }

  const apiKey = process.env.QWEN_API_KEY?.trim();
  if (!apiKey) return mockLlmResponse(messages, tier, model);
  const started = Date.now();
  const result = await withLlmRetry(() =>
    callOpenAICompatible(QWEN_BASE_URL, apiKey, model, messages, {
      maxTokens: 1536,
      provider: "qwen",
    })
  );
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
  const label = tier === "pro" ? "Qwen3.6-Plus" : "DeepSeek V4-Flash";
  const envHint = tier === "pro" ? "QWEN_API_KEY" : "DEEPSEEK_API_KEY";
  return {
    reply: `（演示模式 · 请配置 ${envHint} · ${label}）\n\n收到：「${lastUser.slice(0, 80)}」\n\n${DEFAULT_SYSTEM_TAIL}`,
    provider: "mock",
    model,
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: 0,
  };
}

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; code?: string };
};

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: { maxTokens: number; provider: string; extraHeaders?: Record<string, string> }
): Promise<LlmResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_LLM_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...options.extraHeaders,
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens,
        temperature: 0.7,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const json = (await res.json()) as OpenAIChatResponse;

    if (!res.ok) {
      const message = json.error?.message ?? `${options.provider} error ${res.status}`;
      lastError = new Error(message);
      if (attempt < MAX_LLM_RETRIES && isRetryableStatus(res.status)) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      throw lastError;
    }

    return {
      reply: json.choices?.[0]?.message?.content?.trim() ?? "…",
      provider: options.provider,
      model,
      promptTokens: json.usage?.prompt_tokens,
      completionTokens: json.usage?.completion_tokens,
    };
  }

  throw lastError ?? new Error(`${options.provider} request failed`);
}

export { DEEPSEEK_MODEL_FREE, QWEN_MODEL_PRO };
