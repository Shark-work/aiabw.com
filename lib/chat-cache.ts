import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { getCacheJson, setCacheJson } from "@/lib/platform-cache";

type Admin = SupabaseClient<Database>;

const AGENT_PROMPT_TTL = 10 * 60;
const RESPONSE_CACHE_TTL = 45;

export type CachedAgentPrompt = {
  id: string;
  name: string;
  systemPrompt: string;
  temperature: number;
};

export async function getCachedAgentPrompt(
  admin: Admin,
  slug: string,
  loader: () => Promise<CachedAgentPrompt | null>
): Promise<CachedAgentPrompt | null> {
  const key = `chat:agent:${slug}`;
  const cached = await getCacheJson<CachedAgentPrompt>(admin, key);
  if (cached?.id) return cached;

  const fresh = await loader();
  if (fresh) {
    await setCacheJson(admin, key, fresh as unknown as Json, AGENT_PROMPT_TTL);
  }
  return fresh;
}

function responseCacheKey(agentSlug: string, message: string, historyTail: string): string {
  const raw = `${agentSlug}|${message.trim().toLowerCase()}|${historyTail}`;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `chat:resp:${hash}`;
}

export async function getCachedChatResponse(
  admin: Admin,
  agentSlug: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string | null> {
  const tail = history
    .slice(-2)
    .map((m) => `${m.role}:${m.content.slice(0, 80)}`)
    .join("|");
  const key = responseCacheKey(agentSlug, message, tail);
  const cached = await getCacheJson<{ reply: string }>(admin, key);
  return cached?.reply ?? null;
}

export async function setCachedChatResponse(
  admin: Admin,
  agentSlug: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  reply: string
): Promise<void> {
  const tail = history
    .slice(-2)
    .map((m) => `${m.role}:${m.content.slice(0, 80)}`)
    .join("|");
  const key = responseCacheKey(agentSlug, message, tail);
  await setCacheJson(admin, key, { reply } as Json, RESPONSE_CACHE_TTL);
}
