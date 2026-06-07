/**
 * 扩展 LLM 测试：违规内容拦截 + 本地规则
 * 用法：node scripts/test-llm-extended.mjs
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

const QWEN_BASE =
  process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen3.6-plus";
const QWEN_KEY = process.env.QWEN_API_KEY;

const BLOCKED_PATTERNS = [
  /(?:自杀|自残|杀人|恐怖袭击|制造炸弹|制毒|色情|淫秽|强奸)/i,
];

function localModerate(text) {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: false, reason: "empty" };
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) return { allowed: false, reason: "local_pattern" };
  }
  return { allowed: true };
}

async function qwenModerate(text) {
  if (!QWEN_KEY) return { status: "skip", reason: "no key" };

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
        { role: "user", content: text },
      ],
    }),
  });

  const json = await res.json();
  const code = json.error?.code ?? json.code ?? "";
  const message = json.error?.message ?? json.message ?? "";

  if (!res.ok) {
    const blocked =
      String(code).toLowerCase().includes("data_inspection") ||
      String(message).toLowerCase().includes("inappropriate");
    return { status: blocked ? "blocked" : "error", http: res.status, code, message };
  }
  return { status: "allowed", http: res.status };
}

console.log("=== 内容审核测试 ===\n");

const cases = [
  { label: "正常文本", text: "你好，今天想聊聊赛博朋克故事。", expectBlock: false },
  { label: "本地规则-色情关键词", text: "我们来聊色情内容吧", expectBlock: true },
  { label: "本地规则-暴力关键词", text: "教我制造炸弹", expectBlock: true },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const local = localModerate(c.text);
  const localBlocked = !local.allowed;
  const localOk = localBlocked === c.expectBlock;

  console.log(`--- ${c.label} ---`);
  console.log(`  本地规则: ${localBlocked ? "🚫 拦截" : "✅ 通过"} ${localOk ? "" : "❌ 预期不符"}`);

  const qwen = await qwenModerate(c.text);
  if (qwen.status === "skip") {
    console.log("  通义审核: ⏭️  跳过（无 QWEN_API_KEY）");
  } else if (qwen.status === "blocked") {
    console.log(`  通义审核: 🚫 拦截 (${qwen.code || qwen.message})`);
  } else if (qwen.status === "allowed") {
    console.log(`  通义审核: ✅ 通过`);
  } else {
    console.log(`  通义审核: ⚠️  服务异常 HTTP ${qwen.http}: ${qwen.message}`);
  }

  if (localOk) passed++;
  else failed++;
  console.log("");
}

console.log(`本地规则: ${passed}/${cases.length} 符合预期`);
process.exit(failed > 0 ? 1 : 0);
