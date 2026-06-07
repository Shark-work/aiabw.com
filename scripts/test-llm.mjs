/**
 * 验证 DeepSeek（免费）与 Qwen（Pro）模型均可正常调用。
 * 用法：node scripts/test-llm.mjs
 * 需先在 .env.local 配置 DEEPSEEK_API_KEY 与 QWEN_API_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const DEEPSEEK_BASE = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

const QWEN_BASE =
  process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen3.6-plus";
const QWEN_KEY = process.env.QWEN_API_KEY;

async function testChat(name, baseUrl, apiKey, model) {
  if (!apiKey) {
    console.error(`❌ ${name}: 缺少 API Key`);
    return false;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const started = Date.now();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 64,
      messages: [
        { role: "system", content: "你是 AIABW 测试助手，用一句中文回复。" },
        { role: "user", content: "你好，请用一句话介绍你自己。" },
      ],
    }),
  });

  const json = await res.json();
  const ms = Date.now() - started;

  if (!res.ok) {
    console.error(`❌ ${name} 失败 (${res.status}, ${ms}ms):`, json.error?.message ?? json.message ?? json);
    return false;
  }

  const reply = json.choices?.[0]?.message?.content?.trim() ?? "(empty)";
  console.log(`✅ ${name} OK (${ms}ms, model=${model})`);
  console.log(`   回复: ${reply.slice(0, 120)}`);
  return true;
}

async function testQwenModeration() {
  if (!QWEN_KEY) {
    console.error("❌ Qwen 审核: 缺少 QWEN_API_KEY");
    return false;
  }

  const url = `${QWEN_BASE.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QWEN_KEY}`,
      "X-DashScope-DataInspection": JSON.stringify({ input: "cip", output: "none" }),
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      max_tokens: 1,
      messages: [
        { role: "system", content: "内容安全检测。" },
        { role: "user", content: "你好，今天天气不错。" },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("❌ Qwen 审核测试失败:", json.error?.message ?? json.message ?? json);
    return false;
  }

  console.log("✅ Qwen 内容审核通道 OK（安全文本通过）");
  return true;
}

console.log("=== AIABW LLM 连通性测试 ===\n");

const results = await Promise.all([
  testChat("DeepSeek (免费用户)", DEEPSEEK_BASE, DEEPSEEK_KEY, DEEPSEEK_MODEL),
  testChat("Qwen (Pro 用户)", QWEN_BASE, QWEN_KEY, QWEN_MODEL),
  testQwenModeration(),
]);

const passed = results.every(Boolean);
console.log(passed ? "\n🎉 全部测试通过" : "\n⚠️  部分测试失败，请检查密钥与模型名称");
process.exit(passed ? 0 : 1);
