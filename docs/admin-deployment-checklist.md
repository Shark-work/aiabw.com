# Admin 运营后台 — 部署前检查

## Supabase SQL（在现有 migration 之后执行）

1. `supabase/migration_admin_ops.sql`
   - `agents.moderation_status` / `moderation_note` / `is_featured` / `sales_count`
   - `admin_audit_log` 审计表
   - 默认运营参数写入 `site_settings`

## 管理员账号

```sql
insert into public.profiles (user_id, role, display_name)
values ('<your-auth-uuid>', 'admin', 'Admin')
on conflict (user_id) do update set role = 'admin';
```

## 依赖

- `recharts`（图表）
- `sonner`（Toast，项目已含）

## 后台路由

| 路径 | 功能 |
|---|---|
| `/admin` | 数据仪表盘 |
| `/admin/users` | 用户管理 |
| `/admin/agents` | Agent 管理 |
| `/admin/orders` | 订单管理 |
| `/admin/subscriptions` | 订阅管理 |
| `/admin/commissions` | 佣金提现 |
| `/admin/moderation` | 内容审核 |
| `/admin/settings` | 系统设置 |

## 权限

- 页面与 `/api/admin/*` 均校验 `profiles.role = 'admin'`
- 数据查询使用 `SUPABASE_SERVICE_ROLE_KEY`（服务端）

## Google Analytics 4

- 测量 ID：`G-11LB54EX3D`（生产环境自动加载，开发环境不加载）
- 前端埋点：`lib/analytics.ts` + `@next/third-parties`
- Admin GA4 报表（可选）：配置 `GA4_PROPERTY_ID` / `GA4_CLIENT_EMAIL` / `GA4_PRIVATE_KEY`

### GA4 Data API 配置步骤

1. Google Cloud 创建服务账号并下载 JSON 密钥
2. GA4 管理后台 → 媒体资源访问管理 → 添加服务账号邮箱（查看者）
3. 媒体资源设置中复制数字 **属性 ID**（非 G- 测量 ID）
4. Vercel 环境变量写入上述三个 GA4_* 变量

## 冒烟测试

1. 非 admin 访问 `/admin` → 跳转 `/account`
2. admin 登录 → 仪表盘显示统计卡片与图表
3. 用户列表搜索、禁用/延长 Pro
4. Agent 审核通过/下架/推荐
5. 待支付订单 → 手动补单
6. 提现申请 → 审核/标记已打款
7. 系统设置保存 → `site_settings` 更新
