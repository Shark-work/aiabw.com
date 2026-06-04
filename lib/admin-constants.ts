export const ADMIN_PAGE_SIZE = 20;

export const ADMIN_NAV = [
  { href: "/admin", label: "数据仪表盘", icon: "layout-dashboard" },
  { href: "/admin/users", label: "用户管理", icon: "users" },
  { href: "/admin/agents", label: "Agent 管理", icon: "bot" },
  { href: "/admin/orders", label: "订单管理", icon: "receipt" },
  { href: "/admin/subscriptions", label: "订阅管理", icon: "crown" },
  { href: "/admin/commissions", label: "佣金提现", icon: "wallet" },
  { href: "/admin/moderation", label: "内容审核", icon: "shield" },
  { href: "/admin/plans", label: "套餐管理", icon: "package" },
  { href: "/admin/transactions", label: "交易流水", icon: "arrow-left-right" },
  { href: "/admin/settings", label: "系统设置", icon: "settings" },
] as const;
