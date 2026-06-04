import { QWEN_BASE_URL, QWEN_MODEL_PRO } from "@/lib/llm-tier";

const BLOCKED_PATTERNS = [
  /(?:自杀|自残|杀人|恐怖袭击|制造炸弹|制毒|色情|淫秽|强奸)/i,
  /(?:child\s*sexual|csam|pedophil)/i,
  /(?:nazi|种族清洗|genocide)/i,
  /\b(kill\s+yourself|kys)\b/i,
];

const MAX_MESSAGE_LENGTH = 2000;
const MAX_AGENT_FIELD_LENGTH = 4000;
const MODERATION_MAX_RETRIES = 2;

const QWEN_RISK_LABELS: Record<string, string> = {
  sexual: "色情",
  violence: "暴力",
  hate: "仇恨",
  harassment: "骚扰",
  self_harm: "自残",
  illicit: "违法",
  political_entity: "涉政实体",
  political_figure: "涉政人物",
  inappropriate_profanity: "攻击辱骂",
  pornographic_adult: "色情",
  violent_incidents: "暴力",
  contraband_drug: "毒品",
};

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: string; categories?: string[] };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDataInspectionFailure(code?: string, message?: string) {
  const c = (code ?? "").toLowerCase();
  const m = (message ?? "").toLowerCase();
  return (
    c.includes("data_inspection") ||
    c.includes("datainspection") ||
    m.includes("inappropriate content") ||
    m.includes("不符合") ||
    m.includes("违规")
  );
}

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

type DashScopeModerationError = {
  error?: { message?: string; code?: string; type?: string };
  code?: string;
  message?: string;
};

/**
 * 通义千问国际版内容审核：DashScope AI 安全护栏（X-DashScope-DataInspection）
 * 使用与 Pro 聊天相同的 QWEN_API_KEY
 */
export async function moderateWithQwen(text: string): Promise<ModerationResult> {
  const apiKey = process.env.QWEN_API_KEY?.trim();
  const trimmed = text.trim();

  if (!trimmed) {
    return { allowed: false, reason: "内容不能为空。" };
  }

  if (!apiKey) {
    return moderateUserInput(trimmed, MAX_AGENT_FIELD_LENGTH);
  }

  const url = `${QWEN_BASE_URL.replace(/\/$/, "")}/chat/completions`;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MODERATION_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-DashScope-DataInspection": JSON.stringify({ input: "cip", output: "none" }),
        },
        body: JSON.stringify({
          model: QWEN_MODEL_PRO,
          max_tokens: 1,
          messages: [
            {
              role: "system",
              content: "你是内容安全检测助手。若用户输入合规，仅回复 OK。",
            },
            { role: "user", content: trimmed },
          ],
        }),
      });

      const json = (await res.json()) as DashScopeModerationError;

      if (!res.ok) {
        const code = json.error?.code ?? json.code;
        const message = json.error?.message ?? json.message ?? "";

        if (isDataInspectionFailure(code, message)) {
          return {
            allowed: false,
            reason: "内容未通过通义千问安全审核，可能包含色情、暴力、违法或其他违规信息。请修改后重试。",
            categories: ["内容安全拦截"],
          };
        }

        lastError = message || `审核服务错误 ${res.status}`;
        if (attempt < MODERATION_MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
          await sleep(600 * (attempt + 1));
          continue;
        }
        return {
          allowed: false,
          reason: lastError || "内容审核服务暂时不可用，请稍后重试。",
        };
      }

      return { allowed: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "审核请求失败";
      if (attempt < MODERATION_MAX_RETRIES) {
        await sleep(600 * (attempt + 1));
        continue;
      }
    }
  }

  return {
    allowed: false,
    reason: lastError ?? "内容审核服务暂时不可用，请稍后重试。",
  };
}

/** @deprecated 使用 moderateWithQwen */
export const moderateWithOpenAI = moderateWithQwen;

export async function moderateTextCombined(text: string, maxLen = MAX_MESSAGE_LENGTH): Promise<ModerationResult> {
  const local = moderateUserInput(text, maxLen);
  if (!local.allowed) return local;
  return moderateWithQwen(text);
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
    const ai = await moderateWithQwen(value!);
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

export { QWEN_RISK_LABELS };
