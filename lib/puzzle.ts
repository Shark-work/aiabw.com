import { sql } from "@vercel/postgres";
import type { DailyPuzzle } from "./types";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
  if (!apiKey) return buildFallbackPuzzle(date);

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

  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
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

  if (!parsed) throw new Error("DeepSeek returned invalid JSON");

  return {
    id: `daily-${date}`,
    date,
    title: parsed.title,
    story: parsed.story,
    question: parsed.question,
    options: parsed.options.slice(0, 4).map((text, index) => ({ id: String(index), text })),
    correctAnswerIndex: Math.min(Math.max(parsed.correctAnswerIndex, 0), 3),
    knowledgePoint: parsed.knowledgePoint,
    hint: parsed.hint,
  };
}

export async function getTodayPuzzle(): Promise<DailyPuzzle> {
  const date = todayKey();

  if (!hasDatabaseUrl) {
    return generatePuzzleFromAI(date).catch(() => buildFallbackPuzzle(date));
  }

  try {
    const result = await sql<{
      id: string;
      quest_date: string;
      title: string;
      story: string;
      question: string;
      options: unknown;
      correct_answer_index: number;
      knowledge_point: string;
      hint: string;
    }>`
      select id, quest_date, title, story, question, options, correct_answer_index, knowledge_point, hint
      from daily_quests
      where quest_date = ${date}::date and status = 'published'
      limit 1;
    `;

    const row = result.rows[0];
    if (row) {
      const options = Array.isArray(row.options)
        ? row.options.map((item, index) => {
            if (typeof item === "string") return { id: String(index), text: item };
            if (item && typeof item === "object" && "text" in item) {
              return { id: String(index), text: String((item as { text: string }).text) };
            }
            return { id: String(index), text: String(item) };
          })
        : [];

      return {
        id: row.id,
        date: row.quest_date,
        title: row.title,
        story: row.story,
        question: row.question,
        options: options.length ? options : buildFallbackPuzzle(date).options,
        correctAnswerIndex: row.correct_answer_index,
        knowledgePoint: row.knowledge_point,
        hint: row.hint,
      };
    }
  } catch {
    return generatePuzzleFromAI(date).catch(() => buildFallbackPuzzle(date));
  }

  return generatePuzzleFromAI(date).catch(() => buildFallbackPuzzle(date));
}

export async function getPuzzleByDate(date: string) {
  if (!hasDatabaseUrl) return null;

  try {
    const result = await sql<{
      id: string;
      quest_date: string;
      title: string;
      story: string;
      question: string;
      options: unknown;
      correct_answer_index: number;
      knowledge_point: string;
      hint: string;
    }>`
      select id, quest_date, title, story, question, options, correct_answer_index, knowledge_point, hint
      from daily_quests
      where quest_date = ${date}::date and status = 'published'
      limit 1;
    `;

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      date: row.quest_date,
      title: row.title,
      story: row.story,
      question: row.question,
      options: Array.isArray(row.options)
        ? row.options.map((item, index) => ({ id: String(index), text: typeof item === "string" ? item : JSON.stringify(item) }))
        : [],
      correctAnswerIndex: row.correct_answer_index,
      knowledgePoint: row.knowledge_point,
      hint: row.hint,
    } satisfies DailyPuzzle;
  } catch {
    return null;
  }
}
