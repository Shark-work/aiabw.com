import { PolicyShell } from "@/components/legal/PolicyShell";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RefundPage() {
  return (
    <PolicyShell title="退款政策" subtitle="最后更新：2026 年 6 月" footer={<LegalFooterLinks />}>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">总则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>
            AIABW 通过 NOWPayments 接受 USDT/USDC 等加密货币支付。由于数字商品与链上交易的特性，退款政策如下所述。
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Pro 订阅</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>Pro 订阅在链上支付确认并激活后，原则上不支持退款。</p>
          <p>若因平台技术故障导致订阅未激活且我们在 7 个工作日内无法修复，你可联系 support@aiabw.com 申请人工核查与补偿（延长订阅或等额抵扣）。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Agent 一次性购买</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>Agent 购买成功后即写入 user_agents 记录并完成数字交付，原则上不支持退款。</p>
          <p>重复扣款、未到账但链上已确认等异常情况，请提供订单号与交易哈希，我们将在 14 个工作日内协助核查。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">创作者提现</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>创作者收益提现一经链上打款完成，不可撤销。请确保收款地址正确。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">联系我们</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-slate-300">
          <p>
            退款与账单问题请发送至{" "}
            <a href="mailto:support@aiabw.com" className="text-cyan-300 underline">
              support@aiabw.com
            </a>
            ，注明注册邮箱与订单号（order_id）。
          </p>
        </CardContent>
      </Card>
    </PolicyShell>
  );
}
