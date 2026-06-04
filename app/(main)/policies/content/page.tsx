import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROHIBITED = [
  "暴力、恐怖主义、自残或伤害他人的内容",
  "色情、性剥削或涉及未成年人的不当内容",
  "仇恨言论、歧视或骚扰",
  "违法活动指导（制毒、黑客攻击、欺诈等）",
  "侵犯他人知识产权或隐私的内容",
  "垃圾信息、恶意软件传播",
];

export default function ContentPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <h1 className="text-4xl font-semibold text-white">内容政策</h1>
        <p className="mt-4 text-sm text-slate-400">最后更新：2026 年 6 月</p>
        <p className="mt-4 text-slate-300">
          AIABW 致力于提供安全、有趣、合规的 AI 娱乐体验。所有用户生成内容与 AI 回复均须遵守本政策。
        </p>
      </section>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">禁止内容</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-7 text-slate-300">
            {PROHIBITED.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">内容审核机制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>
            平台在聊天发送前对用户输入进行自动化内容审核（关键词与模式匹配）。违规内容将被拦截，不会发送至大模型 API。
          </p>
          <p>AI 生成的回复同样经过输出审核。不符合政策的内容将被替换为安全提示。</p>
          <p>试用记录（trial_logs）用于安全审计与滥用检测。严重违规可能导致账户暂停。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">举报与申诉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>如发现违规 Agent 或内容，请发送邮件至 support@aiabw.com，注明相关 Agent 名称与问题描述。</p>
          <p>如对审核结果有异议，可在 7 日内提交申诉，我们将人工复核。</p>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500">
        <Link href="/policies/terms" className="text-cyan-300 underline">
          服务条款
        </Link>
        {" · "}
        <Link href="/policies/privacy" className="text-cyan-300 underline">
          隐私政策
        </Link>
      </p>
    </div>
  );
}
