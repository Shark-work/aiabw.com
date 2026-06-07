export type SiteVersion = {
  version: string;
  label: string;
  releasedAt: string;
  notes: string[];
};

export const CURRENT_SITE_VERSION = "v2026.06.07-01";

export const LOCAL_VERSION_SHA = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local-dev";

export const SITE_VERSION_HISTORY: SiteVersion[] = [
  {
    version: "v2026.06.07-01",
    label: "admin 路由诊断与站点版本展示",
    releasedAt: "2026-06-07",
    notes: [
      "新增 /admin/health 线上诊断页",
      "新增 /diagnostics 统一排障页",
      "底部展示当前版本号并可查看历史更新",
    ],
  },
  {
    version: "v2026.06.01-03",
    label: "生产环境稳定性修复",
    releasedAt: "2026-06-01",
    notes: ["修复登录、后台与支付链路中的若干生产问题"],
  },
  {
    version: "v2026.05.28-02",
    label: "上线前内容与后台优化",
    releasedAt: "2026-05-28",
    notes: ["更新后台导航、内容审核与页面布局"],
  },
];
