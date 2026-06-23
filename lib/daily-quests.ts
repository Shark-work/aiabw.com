import { sql } from "@vercel/postgres";
import type { DailyPuzzle } from "./types";
import { DEFAULT_TOPIC_PROMPT, getTopicById } from "./admin-db";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function weekdayNumber(date = new Date()) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export type GenerateDraftResult =
  | {
      ok: true;
      skipped: false;
      date: string;
      questId: string | null;
      puzzle: DailyPuzzle;
    }
  | {
      ok: true;
      skipped: true;
      date: string;
      reason: string;
    }
  | {
      ok: false;
      date: string;
      stage: "database" | "deepseek" | "parse" | "insert";
      error: string;
    };

export type PublishTodayResult =
  | {
      ok: true;
      published: true;
      date: string;
      questId: string;
    }
  | {
      ok: true;
      published: false;
      date: string;
      reason: "already_published" | "no_draft";
      message: string;
    }
  | {
      ok: false;
      date: string;
      stage: "database";
      error: string;
    };

function toDailyPuzzle(row: {
  id: string;
  quest_date: string;
  title: string;
  story: string;
  question: string;
  options: unknown;
  correct_answer_index: number;
  knowledge_point: string;
  hint: string;
}): DailyPuzzle {
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
    options,
    correctAnswerIndex: row.correct_answer_index,
    knowledgePoint: row.knowledge_point,
    hint: row.hint,
  };
}

export async function getQuestForToday() {
  const date = todayKey();
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

  return toDailyPuzzle(row);
}

export async function getQuestByDate(date: string) {
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
  return row ? toDailyPuzzle(row) : null;
}

export async function getExistingQuestForDate(date: string) {
  const result = await sql<{
    id: string;
    quest_date: string;
    status: string;
  }>`
    select id, quest_date, status
    from daily_quests
    where quest_date = ${date}::date and status in ('draft', 'published')
    limit 1;
  `;

  return result.rows[0] ?? null;
}

async function getPromptTemplateForDate(date: string) {
  const weekday = weekdayNumber(new Date(`${date}T00:00:00`));
  const schedule = await sql<{ topic_id: string | null }>`
    select topic_id
    from schedule_config
    where day_of_week = ${weekday} and is_active = true
    limit 1;
  `;

  const topicId = schedule.rows[0]?.topic_id;
  if (!topicId) return DEFAULT_TOPIC_PROMPT;

  const topic = await getTopicById(topicId);
  return topic?.prompt_template?.trim() || DEFAULT_TOPIC_PROMPT;
}

async function generatePuzzleFromAI(date: string, promptTemplate: string): Promise<DailyPuzzle> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
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
          content: promptTemplate,
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

export async function generateAndStoreDraftForToday(): Promise<GenerateDraftResult> {
  const date = todayKey();

  try {
    const existing = await getExistingQuestForDate(date);
    if (existing) {
      return { ok: true, skipped: true, date, reason: `daily_quests already has ${existing.status} for today` };
    }
  } catch (error) {
    return { ok: false, date, stage: "database", error: error instanceof Error ? error.message : "Failed to check existing quest" };
  }

  let promptTemplate: string;
  try {
    promptTemplate = await getPromptTemplateForDate(date);
  } catch (error) {
    return { ok: false, date, stage: "database", error: error instanceof Error ? error.message : "Failed to read schedule or topic prompt" };
  }

  let puzzle: DailyPuzzle;
  try {
    puzzle = await generatePuzzleFromAI(date, promptTemplate);
  } catch (error) {
    return { ok: false, date, stage: "deepseek", error: error instanceof Error ? error.message : "Failed to generate puzzle" };
  }

  try {
    const result = await sql<{ id: string }>`
      insert into daily_quests (
        quest_date,
        topic_id,
        title,
        story,
        question,
        options,
        correct_answer_index,
        knowledge_point,
        hint,
        source,
        status
      )
      values (
        ${date}::date,
        (select topic_id from schedule_config where day_of_week = ${weekdayNumber()} and is_active = true limit 1),
        ${puzzle.title},
        ${puzzle.story},
        ${puzzle.question},
        ${JSON.stringify(puzzle.options)},
        ${puzzle.correctAnswerIndex},
        ${puzzle.knowledgePoint},
        ${puzzle.hint},
        'deepseek',
        'draft'
      )
      returning id;
    `;

    return { ok: true, skipped: false, date, questId: result.rows[0]?.id ?? null, puzzle };
  } catch (error) {
    return { ok: false, date, stage: "insert", error: error instanceof Error ? error.message : "Failed to insert draft" };
  }
}

export async function publishTodayDraft() {
  const date = todayKey();

  try {
    const published = await sql<{ id: string }>`
      select id
      from daily_quests
      where quest_date = ${date}::date and status = 'published'
      limit 1;
    `;

    if (published.rows[0]) {
      return { ok: true as const, published: false as const, date, reason: "already_published" as const, message: "今天已发布" };
    }

    const draft = await sql<{ id: string }>`
      select id
      from daily_quests
      where quest_date = ${date}::date and status = 'draft'
      order by updated_at desc
      limit 1;
    `;

    const draftRow = draft.rows[0];
    if (!draftRow) {
      return { ok: true as const, published: false as const, date, reason: "no_draft" as const, message: "没有待发布的草稿" };
    }

    const updated = await sql<{ id: string }>`
      update daily_quests
      set status = 'published', updated_at = now()
      where id = ${draftRow.id}
      returning id;
    `;

    return { ok: true as const, published: true as const, date, questId: updated.rows[0]?.id ?? draftRow.id };
  } catch (error) {
    return { ok: false as const, date, stage: "database" as const, error: error instanceof Error ? error.message : "Failed to publish draft" };
  }
}
