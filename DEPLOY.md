# DailyQuest 部署指南（Supabase + Vercel）

本文档说明如何把 DailyQuest 从 GitHub 部署到 Vercel，并包含环境变量、Cron Jobs、域名绑定、上线检查清单，以及可直接粘贴到 Vercel 环境变量界面的键值对列表。

---

## 1. 从 GitHub 导入到 Vercel

### 1.1 准备代码仓库

1. 确认代码已推送到 GitHub。
2. 仓库根目录包含：
   - `package.json`
   - `next.config.mjs`
   - `vercel.json`
   - `app/`
   - `components/`
   - `lib/`

### 1.2 在 Vercel 中导入项目

1. 登录 [Vercel](https://vercel.com)。
2. 点击 **Add New...** → **Project**。
3. 选择 **Import Git Repository**。
4. 授权 GitHub 账号并选择你的 DailyQuest 仓库。
5. 点击 **Import**。

### 1.3 配置构建设置

一般情况下 Vercel 会自动识别 Next.js 项目。
如需手动确认，推荐如下：

- **Framework Preset**：Next.js
- **Build Command**：`npm run build`
- **Output Directory**：留空，由 Vercel 自动处理
- **Install Command**：`npm install`

### 1.4 首次部署

1. 点击 **Deploy**。
2. 等待构建完成。
3. 若部署失败，先检查环境变量是否缺失。

---

## 2. 必须设置的环境变量

下面这些变量建议在 Vercel 的 **Environment Variables** 中配置。

### 必填

#### `DATABASE_URL`
- **用途**：Supabase/Postgres 数据库连接串。
- **说明**：后台题材管理、排期管理、每日题库都依赖数据库。

#### `ADMIN_EMAIL`
- **用途**：后台管理员邮箱。
- **说明**：只有这个邮箱可以访问 `/admin/topics` 和 `/admin/schedule`。

#### `DEEPSEEK_API_KEY`
- **用途**：调用 DeepSeek 生成谜题。
- **说明**：如果不配置，首页仍可使用本地 fallback 谜题，但正式上线建议配置。

### 可选

#### `DEEPSEEK_MODEL`
- **用途**：指定 DeepSeek 模型名。
- **默认值**：`deepseek-chat`

#### `NEXT_PUBLIC_SITE_URL`
- **用途**：站点公开 URL。
- **说明**：如果你后续加分享、回跳或绝对链接，可配置。

---

## 3. Supabase 的 `DATABASE_URL` 获取方式

如果你使用 Supabase：

1. 打开 Supabase 项目。
2. 进入 **Project Settings** → **Database**。
3. 找到连接信息中的 `Connection string`。
4. 复制标准 Postgres 连接串，形如：

```text
postgresql://USER:PASSWORD@HOST:5432/postgres
```

5. 粘贴到 Vercel 的 `DATABASE_URL`。

注意：
- 如果 Supabase 要求 SSL，请确保连接串与 Vercel 可用。
- 建议使用 Supabase 提供的标准 URI，而不是临时本地地址。

---

## 4. Cron Jobs 自动出题配置

### 4.1 当前项目是否已有 Cron

当前项目的核心逻辑已经包含：
- `/api/daily`
- `/api/answer`

如果你希望 Vercel 定时自动触发每日出题，可以新增 Cron 任务来请求 `/api/daily`。

### 4.2 推荐做法

在 Vercel 项目中添加一个定时任务，定期请求：

```text
/api/daily
```

### 4.3 `vercel.json` 示例

如果你希望把 Cron 写入项目，可以在 `vercel.json` 中加入类似配置：

```json
{
  "crons": [
    {
      "path": "/api/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

说明：
- `0 0 * * *` 表示每天 00:00 触发一次。
- 具体执行时间会按 Vercel 计划和时区策略处理。

### 4.4 更稳妥的出题策略

推荐你同时保留两层保障：

1. **定时触发** `/api/daily`
2. **用户访问首页时兜底生成**

这样即使 Cron 未按时触发，首页仍能正常展示谜题。

---

## 5. 绑定自定义域名 `aiabw.com`

### 5.1 在 Vercel 添加域名

1. 打开 Vercel 项目。
2. 进入 **Settings** → **Domains**。
3. 点击 **Add**。
4. 输入 `aiabw.com`。
5. 同时建议添加：
   - `www.aiabw.com`

### 5.2 配置 DNS

到你的域名服务商（如 Cloudflare、Namecheap、阿里云、腾讯云等）里设置 DNS：

#### 根域名 `aiabw.com`
- **类型**：A 记录
- **主机名**：`@`
- **值**：Vercel 提供的 A 记录目标地址（以控制台提示为准）

#### `www.aiabw.com`
- **类型**：CNAME
- **主机名**：`www`
- **值**：`cname.vercel-dns.com`

### 5.3 等待生效

- DNS 生效一般需要几分钟到数小时。
- Vercel 会自动检测域名状态。

### 5.4 推荐配置

建议把主域名设为：
- `aiabw.com`

并把 `www.aiabw.com` 301 跳转到主域名，保持统一访问入口。

---

## 6. 部署后的验证清单

### 首页
- [ ] 打开首页可以看到今日谜题卡片
- [ ] 背景、排版、毛玻璃效果正常
- [ ] DeepSeek 可用时显示 AI 生成题目
- [ ] DeepSeek 不可用时能正常 fallback

### 答题
- [ ] 点击选项后能返回对错结果
- [ ] 正确答案提示正常
- [ ] 错误答案提示正常
- [ ] `/api/answer` 请求无 500 错误

### 后台管理
- [ ] `/admin/topics?email=你的管理员邮箱` 可访问
- [ ] `/admin/schedule?email=你的管理员邮箱` 可访问
- [ ] 非管理员访问会被拦截或重定向
- [ ] 题材新增/编辑可正常保存
- [ ] 题材启用/停用开关正常
- [ ] 排期选择后可自动保存

### 数据库
- [ ] `topic_categories` 表已创建
- [ ] `schedule_config` 表已创建
- [ ] `daily_quests` 表已创建
- [ ] `users` 表已创建
- [ ] `user_answers` 表已创建

---

## 7. 部署前建议检查

1. 本地执行：

```bash
npm install
npm run build
npm run lint
```

2. 确认数据库连接正常。
3. 确认环境变量都已填完。
4. 确认后台邮箱 `ADMIN_EMAIL` 正确。
5. 确认 `vercel.json` 已提交到仓库。

---

## 8. 可直接粘贴到 Vercel 环境变量界面的键值对列表

下面是你可以直接照着填的列表。

### 生产环境（Production）

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
ADMIN_EMAIL=admin@yourdomain.com
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=https://aiabw.com
```

### 预览环境（Preview）

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
ADMIN_EMAIL=admin@yourdomain.com
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=https://preview-aiabw.vercel.app
```

### 开发环境（Development）

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
ADMIN_EMAIL=admin@yourdomain.com
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 9. 备注

- 如果你暂时没有配置 `DEEPSEEK_API_KEY`，项目仍然可以正常运行。
- 该版本已经不再依赖 KV，因此项目在没有任何 KV 环境变量的情况下也能正常运行。
- 如果你暂时没有 Cron Jobs，也不影响首页正常出题，因为项目里已经有兜底逻辑。
