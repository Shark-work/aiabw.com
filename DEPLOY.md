# Vercel 环境变量清单与上线检查表

## 一、环境变量清单

请在 Vercel 项目的 Environment Variables 中配置以下变量：

### 1. `DEEPSEEK_API_KEY`
- **用途**：调用 DeepSeek API 生成每日谜题。
- **类型**：必填（生产环境强烈建议配置）
- **来源**：DeepSeek 控制台或你的 API Key 管理页面。
- **说明**：如果未配置，当前项目会自动使用本地默认谜题作为 fallback，不会导致首页和接口完全不可用。

### 2. `DEEPSEEK_MODEL`
- **用途**：指定 DeepSeek 使用的模型名称。
- **类型**：可选
- **默认值**：`deepseek-chat`
- **说明**：如需要切换模型，可在 Vercel 中覆盖该值。

### 3. `KV_REST_API_URL`
- **用途**：Vercel KV 连接地址。
- **类型**：必填
- **说明**：由 Vercel KV 资源自动注入。

### 4. `KV_REST_API_TOKEN`
- **用途**：Vercel KV 访问令牌。
- **类型**：必填
- **说明**：由 Vercel KV 资源自动注入。

### 5. `KV_REST_API_READ_ONLY_TOKEN`
- **用途**：Vercel KV 只读访问令牌。
- **类型**：必填
- **说明**：由 Vercel KV 资源自动注入。

### 6. `KV_URL`
- **用途**：兼容某些运行时读取方式的 KV 地址。
- **类型**：建议同步检查
- **说明**：若你的 Vercel KV 资源提供该值，也建议一并确认。

---

## 二、上线检查表

### 代码与依赖
- [ ] `package.json` 已将 `next` 锁定为 `14.2.5`
- [ ] `react` 已锁定为 `18.2.0`
- [ ] 已执行 `npm install` 重新生成锁文件与依赖树
- [ ] `npm run build` 本地构建通过
- [ ] `npm run lint` 本地检查通过

### 接口与功能
- [ ] `/api/daily` 可正常生成或读取当天谜题
- [ ] `/api/answer` 可正确比对用户答案
- [ ] `DEEPSEEK_API_KEY` 缺失时仍能返回本地 fallback 谜题
- [ ] KV 中能保存当天谜题数据，且可重复读取

### Vercel 配置
- [ ] 项目已绑定正确的 Vercel 仓库
- [ ] 已接入 Vercel KV 资源
- [ ] 已配置生产环境变量
- [ ] 已确认 `vercel.json` 生效
- [ ] API 路由在 Vercel 上未超时

### 发布前验证
- [ ] 首页可正常展示今日谜题
- [ ] 选项点击后接口返回结果正常
- [ ] 正确答案与错误答案反馈正常
- [ ] 移动端和桌面端显示正常

---

## 三、推荐部署步骤

1. 在本地执行依赖重装：
   `npm install`
2. 检查 `npm run build`
3. 确认 Vercel 已绑定 KV
4. 配置 `DEEPSEEK_API_KEY`
5. 推送代码并部署

---

## 四、备注

- 该项目已经包含 `DEEPSEEK_API_KEY` 缺失时的本地默认谜题逻辑，适合先部署后补密钥。
- 若后续要做“每日仅生成一次”的严格控制，可以继续在 KV 中增加 `date` 键和定时任务。
