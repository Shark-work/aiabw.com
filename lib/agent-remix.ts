import type { Json } from "@/types/database.types";
import { getAgentPriceUsdt, isAgentFree } from "@/lib/products";

export type RemixTemplate = {
  sourceSlug: string;
  sourceName: string;
  sourceAgentId: string;
  name: string;
  description: string;
  prompt: string;
  categorySlug: string;
  style: string;
  priceUsdt: number;
  tags: string[];
};

type AgentSource = {
  id: string;
  slug: string;
  name: string;
  description: string;
  prompt: string | null;
  system_prompt: string | null;
  metadata: Json;
  category: { slug: string } | null;
};

export function buildRemixTemplate(agent: AgentSource): RemixTemplate {
  const meta = (agent.metadata ?? {}) as Record<string, unknown>;
  const categorySlug =
    agent.category?.slug ??
    (typeof meta.pillar === "string" ? meta.pillar : "companion");
  const style = typeof meta.style === "string" ? meta.style : "";
  const tags = Array.isArray(meta.tags) ? (meta.tags as string[]) : [];
  const price = isAgentFree(meta) ? 0 : getAgentPriceUsdt(meta);

  let prompt = agent.prompt ?? "";
  if (agent.system_prompt && agent.system_prompt.length > prompt.length) {
    prompt = agent.system_prompt;
  }

  return {
    sourceSlug: agent.slug,
    sourceName: agent.name,
    sourceAgentId: agent.id,
    name: `${agent.name} · Remix`,
    description: agent.description,
    prompt,
    categorySlug,
    style,
    priceUsdt: price,
    tags,
  };
}
