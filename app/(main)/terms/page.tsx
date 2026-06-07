import { PolicyShell } from "@/components/legal/PolicyShell";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <PolicyShell title="服务条款" subtitle="最后更新：2026 年 6 月" footer={<LegalFooterLinks />}>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">1. 服务说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>
            AIABW（艾比世界）是一个 AI Agent 娱乐平台，提供角色扮演、故事共创、虚拟陪伴等交互服务。使用本平台即表示你同意本服务条款。
          </p>
          <p>本平台提供的 AI 生成内容仅供娱乐，不构成专业建议（包括但不限于医疗、法律、财务、心理咨询）。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">2. 账户与订阅</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>你需要提供有效的邮箱注册账户。Pro 订阅通过 NOWPayments 以 USDT/USDC 支付，订阅周期以购买时选择的方案为准。</p>
          <p>加密货币支付完成后，订阅状态将在链上确认后自动激活。因区块链网络延迟导致的激活延迟不属于平台违约。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">3. Agent 购买与创作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>部分 Agent 支持一次性购买永久解锁。购买成功后绑定至你的账户，可在订阅到期后继续使用。</p>
          <p>用户创建的 Agent 须通过平台内容审核（含 OpenAI Moderation）。违规内容将被拒绝发布，严重者可能封禁账户。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">4. 用户责任</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>你不得利用本平台生成违法、有害、骚扰、歧视、色情、暴力或其他违反《内容政策》的内容。平台有权暂停或终止违规账户。</p>
        </CardContent>
      </Card>
    </PolicyShell>
  );
}
