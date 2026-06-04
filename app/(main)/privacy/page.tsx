import { PolicyShell } from "@/components/legal/PolicyShell";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <PolicyShell title="隐私政策" subtitle="最后更新：2026 年 6 月" footer={<LegalFooterLinks />}>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">我们收集的信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>· 账户信息：邮箱地址（通过 Supabase Auth 管理）</p>
          <p>· 使用数据：试用次数、聊天记录（用于提供服务与内容审核）、订单与支付状态</p>
          <p>· 技术数据：页面访问量统计、Google Analytics 4 匿名浏览数据（如已配置）</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">信息使用方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>我们使用你的信息来：提供 AI 聊天服务、处理支付与订阅、执行内容审核（含 OpenAI Moderation）、改进产品体验。</p>
          <p>聊天与创建 Agent 的文本可能发送至第三方大模型 API（DeepSeek、Anthropic、OpenAI 等）。请勿输入敏感个人信息。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">数据存储与安全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>数据存储在 Supabase（PostgreSQL）中，受 Row Level Security 保护。支付由 NOWPayments 处理，我们不存储钱包私钥。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">你的权利</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>你可以请求访问、更正或删除你的个人数据。请联系 support@aiabw.com。</p>
        </CardContent>
      </Card>
    </PolicyShell>
  );
}
