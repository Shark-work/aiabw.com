export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult =
  | { ok: true; id: string; provider: "resend" | "console" }
  | { ok: false; error: string; provider: "resend" | "console" };

const APP_NAME = "AIABW·艾比世界";

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? "AIABW <noreply@aiabw.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Missing RESEND_API_KEY", provider: "console" };
    }
    console.info("[email:dev]", input.to, input.subject);
    return { ok: true, id: `dev_${Date.now()}`, provider: "console" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags,
    }),
  });

  const text = await res.text();
  let json: { id?: string; message?: string } = {};
  try {
    json = JSON.parse(text) as { id?: string; message?: string };
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    return { ok: false, error: json.message ?? text, provider: "resend" };
  }

  return { ok: true, id: json.id ?? "unknown", provider: "resend" };
}

export function emailLayout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aiabw.com";
  const ctaBlock = cta
    ? `<p style="margin:28px 0 0"><a href="${cta.href}" style="display:inline-block;padding:12px 24px;border-radius:12px;background:linear-gradient(135deg,#22d3ee,#a78bfa);color:#0f172a;font-weight:600;text-decoration:none">${cta.label}</a></p>`
    : "";

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#0b1020;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="border-radius:20px;border:1px solid rgba(34,211,238,0.25);background:linear-gradient(145deg,rgba(34,211,238,0.08),rgba(167,139,250,0.08));padding:28px">
      <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#67e8f9;margin-bottom:8px">${APP_NAME}</div>
      <h1 style="margin:0 0 16px;font-size:22px;color:#fff">${title}</h1>
      <div style="font-size:15px;line-height:1.7;color:#cbd5e1">${bodyHtml}</div>
      ${ctaBlock}
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#64748b;text-align:center">
      <a href="${appUrl}/account" style="color:#94a3b8">通知偏好</a> · ${appUrl}
    </p>
  </div>
</body></html>`;
}

export function subscriptionExpiringEmail(planName: string, periodEnd: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aiabw.com";
  const endLabel = new Date(periodEnd).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return {
    subject: `【${APP_NAME}】Pro 订阅将在 3 天后到期`,
    html: emailLayout(
      "Pro 订阅即将到期",
      `<p>你的 <strong>${planName}</strong> 将于 <strong>${endLabel}</strong> 到期。</p>
       <p>续费后可继续享受无限聊天、无限创建 Agent 等 Pro 权益。</p>`,
      { label: "立即续费 Pro", href: `${appUrl}/checkout?plan=pro` }
    ),
    text: `你的 ${planName} 将于 ${endLabel} 到期。续费：${appUrl}/checkout?plan=pro`,
  };
}

export function creatorNewAgentEmail(creatorName: string, agentName: string, agentSlug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aiabw.com";
  return {
    subject: `【${APP_NAME}】${creatorName} 发布了新 Agent「${agentName}」`,
    html: emailLayout(
      "关注的创作者有新作品",
      `<p>你关注的创作者 <strong>${creatorName}</strong> 刚刚发布了新 Agent：</p>
       <p style="font-size:18px;color:#67e8f9;margin:16px 0"><strong>${agentName}</strong></p>
       <p>快去试用、收藏或 Remix 吧。</p>`,
      { label: "查看 Agent", href: `${appUrl}/agents/${agentSlug}` }
    ),
    text: `${creatorName} 发布了 ${agentName}：${appUrl}/agents/${agentSlug}`,
  };
}

export function inactiveRecallEmail(displayName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aiabw.com";
  const name = displayName || "探索者";
  return {
    subject: `【${APP_NAME}】你的 Agent 宇宙在等你回来`,
    html: emailLayout(
      "好久不见，艾比想你了",
      `<p>嗨 ${name}，你已经有一周没回到艾比世界了。</p>
       <p>新的 Agent、创作者作品和 Pro 权益都在等你探索。</p>`,
      { label: "回到艾比世界", href: `${appUrl}/explore` }
    ),
    text: `好久不见 ${name}，回来看看：${appUrl}/explore`,
  };
}
