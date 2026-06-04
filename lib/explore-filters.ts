/** Explore 广场固定筛选标签 → 数据库 agent_tags / metadata.tags 同义词 */
export const EXPLORE_FEATURED_FILTERS = [
  {
    id: "companion",
    label: "虚拟伴侣",
    tags: ["虚拟伴侣", "陪伴", "companion", "猫娘", "恋爱", "治愈", "知己"],
  },
  {
    id: "rpg",
    label: "RPG",
    tags: ["rpg", "跑团", "地牢", "勇者", "游戏", "骰子", "冒险", "gm"],
  },
  {
    id: "story",
    label: "故事",
    tags: ["故事", "小说", "奇幻", "story", "分支", "甜宠", "怪谈", "世界观"],
  },
  {
    id: "cyberpunk",
    label: "赛博朋克",
    tags: ["赛博朋克", "赛博", "霓虹", "cyber", "cyberpunk", "星港", "夜聊"],
  },
] as const;

export type ExploreFilterId = (typeof EXPLORE_FEATURED_FILTERS)[number]["id"];

const FILTER_BY_ID = Object.fromEntries(EXPLORE_FEATURED_FILTERS.map((f) => [f.id, f])) as Record<
  ExploreFilterId,
  (typeof EXPLORE_FEATURED_FILTERS)[number]
>;

export function isExploreFilterId(value: string): value is ExploreFilterId {
  return value in FILTER_BY_ID;
}

export function resolveExploreSearchTags(filterIds: string[]): string[] {
  const out = new Set<string>();
  for (const id of filterIds) {
    if (!isExploreFilterId(id)) continue;
    for (const t of FILTER_BY_ID[id].tags) {
      out.add(t.toLowerCase());
    }
  }
  return [...out];
}

export function getExploreFilterLabel(id: ExploreFilterId): string {
  return FILTER_BY_ID[id].label;
}
