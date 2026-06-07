-- 从 agents.metadata.tags 同步 agent_tags（搜索 / 筛选）
-- 在 seed.sql 之后执行

delete from public.agent_tags t
where not exists (
  select 1 from public.agents a
  where a.id = t.agent_id and a.status = 'active' and a.visibility = 'public'
);

insert into public.agent_tags (agent_id, tag)
select a.id, trim(t.tag)
from public.agents a
cross join lateral jsonb_array_elements_text(coalesce(a.metadata->'tags', '[]'::jsonb)) as t(tag)
where a.status = 'active'
  and a.visibility = 'public'
  and trim(t.tag) <> ''
on conflict (agent_id, tag) do nothing;
