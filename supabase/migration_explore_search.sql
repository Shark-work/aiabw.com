-- Explore 高性能模糊搜索：pg_trgm RPC + 标签索引
create extension if not exists pg_trgm;

-- 标签筛选加速（与 phase2 互补）
create index if not exists idx_agent_tags_tag_lower on public.agent_tags (lower(tag));
create index if not exists idx_agent_tags_agent_tag on public.agent_tags (agent_id, tag);

-- 公开 Agent 列表
create index if not exists idx_agents_public_created on public.agents (created_at desc)
  where status = 'active' and visibility = 'public';

create or replace function public.search_public_agents(
  p_q text default '',
  p_tags text[] default array[]::text[],
  p_category_slug text default null,
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  slug text,
  name text,
  description text,
  metadata jsonb,
  category_name text,
  category_slug text,
  rank real
)
language sql
stable
set search_path = public
as $$
  with tag_list as (
    select distinct lower(trim(t)) as tag
    from unnest(coalesce(p_tags, array[]::text[])) as u(t)
    where trim(t) <> ''
  ),
  scoped as (
    select
      a.id,
      a.slug,
      a.name,
      a.description,
      a.metadata,
      c.name as category_name,
      c.slug as category_slug,
      a.created_at
    from public.agents a
    left join public.categories c on c.id = a.category_id
    where a.status = 'active'
      and a.visibility = 'public'
      and (p_category_slug is null or c.slug = p_category_slug)
      and (
        not exists (select 1 from tag_list)
        or exists (
          select 1
          from public.agent_tags at
          inner join tag_list tl on lower(at.tag) = tl.tag
          where at.agent_id = a.id
        )
        or exists (
          select 1
          from jsonb_array_elements_text(coalesce(a.metadata->'tags', '[]'::jsonb)) mt(tag)
          inner join tag_list tl on lower(trim(mt.tag)) = tl.tag
        )
      )
  ),
  scored as (
    select
      s.*,
      case
        when coalesce(nullif(trim(p_q), ''), '') = '' or char_length(trim(p_q)) < 2 then 0::real
        else greatest(
          similarity(s.name, trim(p_q)),
          similarity(s.description, trim(p_q)),
          word_similarity(trim(p_q), s.name),
          word_similarity(trim(p_q), s.description)
        )
      end as sim
    from scoped s
  ),
  filtered as (
    select *
    from scored
    where
      coalesce(nullif(trim(p_q), ''), '') = ''
      or char_length(trim(p_q)) < 2
      or sim >= 0.12
      or name ilike '%' || trim(p_q) || '%'
      or description ilike '%' || trim(p_q) || '%'
      or slug ilike '%' || trim(p_q) || '%'
  )
  select
    f.slug,
    f.name,
    f.description,
    f.metadata,
    f.category_name,
    f.category_slug,
    f.sim as rank
  from filtered f
  order by f.sim desc, f.created_at desc
  limit greatest(1, least(p_limit, 48))
  offset greatest(0, p_offset);
$$;

comment on function public.search_public_agents is 'Explore 模糊搜索 + 标签筛选（pg_trgm + agent_tags）';

grant execute on function public.search_public_agents to service_role;
