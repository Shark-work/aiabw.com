-- 为 Explore 固定标签补充同义词（在 seed.sql + seed_tags.sql 之后执行）
insert into public.agent_tags (agent_id, tag)
select a.id, t.tag
from public.agents a
cross join lateral (
  values
    ('赛博朋克'),
    ('赛博'),
    ('RPG'),
    ('虚拟伴侣')
) as t(tag)
where a.status = 'active'
  and a.visibility = 'public'
  and (
    a.metadata->>'pillar' in ('companion', 'adventure', 'story-universe', 'game', 'meme')
    or a.name ilike '%赛博%'
    or a.name ilike '%霓虹%'
    or a.description ilike '%赛博%'
    or a.description ilike '%跑团%'
    or a.description ilike '%故事%'
    or a.description ilike '%陪伴%'
  )
on conflict (agent_id, tag) do nothing;
