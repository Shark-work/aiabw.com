import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { PolicyShell } from "@/components/legal/PolicyShell";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <PolicyShell title="关于 AIABW · 艾比世界" subtitle="全球最有趣的 AI Agent 游乐场" footer={<LegalFooterLinks />}>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            我们是谁
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>
            AIABW（艾比世界，aiabw.com）是一个赛博梦幻风格的 AI Agent 娱乐平台。你可以与虚拟伴侣聊天、共创故事宇宙、探索冒险世界、玩 Meme 整活与游戏乐园类 Agent。
          </p>
          <p>
            平台支持 Pro 订阅、Agent 一次性购买、创作者分成与邀请返利，由 NOWPayments 提供 USDT 链上支付能力。
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">安全与合规</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
          <p>用户创建 Agent 与聊天内容均经过本地规则 + OpenAI Moderation 双重审核，拦截色情、暴力等违规内容。</p>
          <p>我们遵守适用的隐私与数据保护要求，详见隐私政策与服务条款。</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-violet-300" />
            开始探索
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/explore">探索广场</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/create">创建 Agent</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/pro">了解 Pro</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500">
        联系：{" "}
        <a href="mailto:support@aiabw.com" className="text-cyan-300 underline">
          support@aiabw.com
        </a>
      </p>
    </PolicyShell>
  );
}
