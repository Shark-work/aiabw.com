import { kv } from "@vercel/kv";
import type { DailyPuzzle } from "./types";

const KV_KEY_PREFIX = "daily-puzzle";
const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function puzzleKey(date: string) {
  return `${KV_KEY_PREFIX}:${date}`;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function buildFallbackPuzzle(date: string): DailyPuzzle {
  return {
    id: `fallback-${date}`,
    date,
    title: "失落神殿的第四道门",
    story:
      "你在古老神殿中发现三条路径，每条路径都指向不同的机关房间。墙上刻着一行提示：真正的出口不会被火焰、镜子或风声迷惑。",
    question: "哪一个选项最可能是通往出口的正确选择？",
    options: [
      { id: "a", text: "点燃火把，沿着最亮的通道前进" },
      { id: "b", text: "跟随镜面反射出的光线走" },
      { id: "c", text: "寻找没有声音回响的石门" },
      { id: "d", text: "追着风从裂缝里吹来的方向走" },
    ],
    correctAnswerIndex: 2,
    knowledgePoint: "这类谜题通常考察排除法与环境线索整合能力。",
    hint: "注意题干中的否定线索：真正的出口不会被三种干扰因素迷惑。",
  };
}

async function generatePuzzleFromAI(date: string): Promise<DailyPuzzle> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return buildFallbackPuzzle(date);
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "你是一个冒险谜题作家，每天生成一个全新的短篇谜题，包含标题、故事、4个选项（其中一个正确）、知识点和提示。输出严格JSON格式。",
        },
        {
          role: "user",
          content:
            "请生成一个适合今日发布的谜题，严格输出 JSON，字段为 title, story, question, options(数组，4项), correctAnswerIndex(0-3), knowledgePoint, hint。options 每项为字符串。",
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = safeJsonParse<{
    title: string;
    story: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    knowledgePoint: string;
    hint: string;
  }>(content);

  if (!parsed) {
    throw new Error("DeepSeek returned invalid JSON");
  }

  const options = parsed.options.slice(0, 4).map((text, index) => ({
    id: String(index),
    text,
  }));

  return {
    id: `daily-${date}`,
    date,
    title: parsed.title,
    story: parsed.story,
    question: parsed.question,
    options,
    correctAnswerIndex: Math.min(Math.max(parsed.correctAnswerIndex, 0), 3),
    knowledgePoint: parsed.knowledgePoint,
    hint: parsed.hint,
  };
}

export async function getTodayPuzzle(): Promise<DailyPuzzle> {
  const date = todayKey();
  const key = puzzleKey(date);

  if (hasKv) {
    const cached = safeJsonParse<DailyPuzzle>(await kv.get<string>(key));
    if (cached) return cached;
  }

  const existing = await generatePuzzleFromAI(date).catch(() => buildFallbackPuzzle(date));

  if (hasKv) {
    await kv.set(key, JSON.stringify(existing), { ex: 60 * 60 * 24 * 7 });
  }

  return existing;
}

export async function storePuzzle(puzzle: DailyPuzzle) {
  if (!hasKv) return;
  await kv.set(puzzleKey(puzzle.date), JSON.stringify(puzzle), { ex: 60 * 60 * 24 * 7 });
}

export async function getPuzzleByDate(date: string) {
  if (!hasKv) return null;
  return safeJsonParse<DailyPuzzle>(await kv.get<string>(puzzleKey(date)));
}
