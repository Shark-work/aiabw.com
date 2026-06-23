import { sql } from "@vercel/postgres";

export type TopicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt_template: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WeeklyScheduleRow = {
  id?: string;
  day_of_week: number;
  topic_id: string | null;
  topic_name: string | null;
  topic_slug: string | null;
  topic_icon: string | null;
  is_active: boolean | null;
  updated_at?: string;
};

export const DEFAULT_TOPIC_PROMPT =
  "你是一个冒险谜题作家，按该题材生成一个全新的短篇谜题，包含标题、故事、4个选项（其中一个正确）、知识点和提示。输出严格JSON格式。";

export async function getAllTopics() {
  const result = await sql<TopicCategory>`
    select id, name, slug, description, prompt_template, icon, sort_order, is_active, created_at, updated_at
    from topic_categories
    order by sort_order asc, created_at desc;
  `;
  return result.rows;
}

export async function getTopicById(id: string) {
  const result = await sql<TopicCategory>`
    select id, name, slug, description, prompt_template, icon, sort_order, is_active, created_at, updated_at
    from topic_categories
    where id = ${id}
    limit 1;
  `;
  return result.rows[0] ?? null;
}

export async function createTopic(input: { name: string; slug: string; description?: string | null; promptTemplate?: string | null; icon?: string; sortOrder?: number; isActive?: boolean; }) {
  const result = await sql<TopicCategory>`
    insert into topic_categories (name, slug, description, prompt_template, icon, sort_order, is_active)
    values (${input.name}, ${input.slug}, ${input.description ?? null}, ${input.promptTemplate ?? DEFAULT_TOPIC_PROMPT}, ${input.icon ?? "🧩"}, ${input.sortOrder ?? 0}, ${input.isActive ?? true})
    returning id, name, slug, description, prompt_template, icon, sort_order, is_active, created_at, updated_at;
  `;
  return result.rows[0];
}

export async function updateTopic(id: string, input: { name?: string; slug?: string; description?: string | null; promptTemplate?: string; icon?: string; sortOrder?: number; isActive?: boolean; }) {
  const result = await sql<TopicCategory>`
    update topic_categories
    set
      name = coalesce(${input.name ?? null}, name),
      slug = coalesce(${input.slug ?? null}, slug),
      description = coalesce(${input.description ?? null}, description),
      prompt_template = coalesce(${input.promptTemplate ?? null}, prompt_template),
      icon = coalesce(${input.icon ?? null}, icon),
      sort_order = coalesce(${typeof input.sortOrder === "number" ? input.sortOrder : null}, sort_order),
      is_active = coalesce(${typeof input.isActive === "boolean" ? input.isActive : null}, is_active),
      updated_at = now()
    where id = ${id}
    returning id, name, slug, description, prompt_template, icon, sort_order, is_active, created_at, updated_at;
  `;
  return result.rows[0] ?? null;
}

export async function getActiveTopics() {
  const result = await sql<TopicCategory>`
    select id, name, slug, description, prompt_template, icon, sort_order, is_active, created_at, updated_at
    from topic_categories
    where is_active = true
    order by sort_order asc, name asc;
  `;
  return result.rows;
}

export async function getWeeklySchedule() {
  const result = await sql<WeeklyScheduleRow>`
    select s.id, s.day_of_week, s.topic_id, t.name as topic_name, t.slug as topic_slug, t.icon as topic_icon, t.is_active, s.updated_at
    from schedule_config s
    left join topic_categories t on t.id = s.topic_id
    order by s.day_of_week asc;
  `;
  return result.rows;
}

export async function upsertWeeklySchedule(dayOfWeek: number, topicId: string | null) {
  const result = await sql<WeeklyScheduleRow>`
    insert into schedule_config (day_of_week, topic_id)
    values (${dayOfWeek}, ${topicId})
    on conflict (day_of_week)
    do update set topic_id = excluded.topic_id, is_active = true, updated_at = now()
    returning id, day_of_week, topic_id, null::text as topic_name, null::text as topic_slug, null::text as topic_icon, null::boolean as is_active, updated_at;
  `;
  return result.rows[0];
}
