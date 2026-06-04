const BLOCKED_PATTERNS = [
  /(?:自杀|自残|杀人|恐怖袭击|制造炸弹|制毒|色情|淫秽|强奸)/i,
  /(?:child\s*sexual|csam|pedophil)/i,
  /(?:nazi|种族清洗|genocide)/i,
  /\b(kill\s+yourself|kys)\b/i,
];

const MAX_MESSAGE_LENGTH = 2000;
const MAX_AGENT_FIELD_LENGTH = 4000;

const OPENAI_CATEGORY_LABELS: Record<string, string> = {
  sexual: "色情",
  "sexual/minors": "涉及未成年人",
  harassment: "骚扰",
  "harassment/threatening": "威胁骚扰",
  hate: "仇恨",
  "hate/threatening": "威胁仇恨",
  illicit: "违法",
  "illicit/violent": "暴力违法",
  "self-harm": "自残",
  "self-harm/intent": "自残意图",
  "self-harm/instructions": "自残指导",
  violence: "暴力",
  "violence/graphic": "血腥暴力",
};

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: string; categories?: string[] };

export function moderateUserInput(text: string, maxLen = MAX_MESSAGE_LENGTH): ModerationResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { allowed: false, reason: "内容不能为空。" };
  }

  if (trimmed.length > maxLen) {
    return { allowed: false, reason: `内容过长，最多 ${maxLen} 字。` };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: "内容包含不符合社区规范的信息，已被拦截。请遵守《内容政策》。",
      };
    }
  }

  return { allowed: true };
}

type OpenAIModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
    category_scores?: Record<string, number>;
  }>;
  error?: { message?: string };
};

function formatFlaggedCategories(categories: Record<string, boolean> | undefined): string[] {
  if (!categories) return [];
  return Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([key]) => OPENAI_CATEGORY_LABELS[key] ?? key);
}

export async function moderateWithOpenAI(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const trimmed = text.trim();

  if (!trimmed) {
    return { allowed: false, reason: "内容不能为空。" };
  }

  if (!apiKey) {
    return moderateUserInput(trimmed, MAX_AGENT_FIELD_LENGTH);
  }

  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: trimmed }),
  });

  const json = (await res.json()) as OpenAIModerationResponse;

  if (!res.ok) {
    return {
      allowed: false,
      reason: json.error?.message ?? "内容审核服务暂时不可用，请稍后重试。",
    };
  }

  const result = json.results?.[0];
  if (result?.flagged) {
    const labels = formatFlaggedCategories(result.categories);
    return {
      allowed: false,
      reason:
        labels.length > 0
          ? `内容未通过 OpenAI 安全审核，可能涉及：${labels.join("、")}。请修改后重试。`
          : "内容未通过 OpenAI 安全审核，可能包含色情、暴力或其他违规信息。",
      categories: labels,
    };
  }

  return { allowed: true };
}

export async function moderateTextCombined(text: string, maxLen = MAX_MESSAGE_LENGTH): Promise<ModerationResult> {
  const local = moderateUserInput(text, maxLen);
  if (!local.allowed) return local;
  return moderateWithOpenAI(text);
}

export type AgentModerationFields = {
  name: string;
  description: string;
  prompt: string;
  style?: string;
};

const AGENT_FIELD_LABELS: Record<keyof AgentModerationFields, string> = {
  name: "角色名称",
  description: "角色简介",
  prompt: "角色 Prompt",
  style: "图像风格",
};

export async function moderateAgentCreation(
  fields: AgentModerationFields
): Promise<ModerationResult> {
  const entries = (
    Object.entries(fields) as Array<[keyof AgentModerationFields, string | undefined]>
  ).filter(([, v]) => typeof v === "string" && v.trim());

  for (const [key, value] of entries) {
    const label = AGENT_FIELD_LABELS[key];
    const local = moderateUserInput(value!, MAX_AGENT_FIELD_LENGTH);
    if (!local.allowed) {
      return { allowed: false, reason: `${label}：${local.reason}` };
    }
  }

  for (const [key, value] of entries) {
    const label = AGENT_FIELD_LABELS[key];
    const ai = await moderateWithOpenAI(value!);
    if (!ai.allowed) {
      return {
        allowed: false,
        reason: `${label}：${ai.reason}`,
        categories: ai.categories,
      };
    }
  }

  return { allowed: true };
}

export function sanitizeOutput(text: string): string {
  return text.slice(0, 8000);
}
