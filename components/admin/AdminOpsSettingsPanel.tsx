"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SiteConfig = Record<string, string>;

type EnvStatus = {
  deepseek: boolean;
  qwen: boolean;
  nowpayments: boolean;
  resend: boolean;
  cron: boolean;
};

const SITE_FIELDS: Array<{ key: string; label: string; type?: "textarea" }> = [
  { key: "site_name", label: "站点名称" },
  { key: "site_url", label: "正式域名" },
  { key: "default_language", label: "默认语言" },
  { key: "payment_provider", label: "支付供应商" },
  { key: "ga4_id", label: "GA4 ID" },
  { key: "creator_share_rate", label: "创作者分成比例 (0-1)" },
  { key: "referral_commission_rate", label: "邀请佣金比例 (0-1)" },
  { key: "trial_daily_limit", label: "免费试用次数/日" },
  { key: "pro_monthly_price_usd", label: "Pro 月费 (USD)" },
  { key: "pro_yearly_price_usd", label: "Pro 年费 (USD)" },
  { key: "email_template_subscription_reminder", label: "订阅提醒邮件模板", type: "textarea" },
  { key: "email_template_creator_new_agent", label: "创作者新 Agent 邮件", type: "textarea" },
  { key: "email_template_inactive_recall", label: "7 日召回邮件", type: "textarea" },
];

export function AdminOpsSettingsPanel() {
  const [tab, setTab] = useState("site");
  const [config, setConfig] = useState<SiteConfig>({});
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ops-settings")
      .then((r) => r.json())
      .then((json: { ok: boolean; config?: SiteConfig; envStatus?: EnvStatus }) => {
        if (json.ok && json.config) setConfig(json.config);
        if (json.envStatus) setEnvStatus(json.envStatus);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ops-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "保存失败");
      toast.success("配置已保存");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs>
      <TabsList className="flex-wrap">
        <TabsTrigger active={tab === "site"} onClick={() => setTab("site")}>站点配置</TabsTrigger>
        <TabsTrigger active={tab === "ops"} onClick={() => setTab("ops")}>运营参数</TabsTrigger>
        <TabsTrigger active={tab === "secrets"} onClick={() => setTab("secrets")}>密钥与支付</TabsTrigger>
      </TabsList>

      <TabsContent className="mt-4 space-y-4">
        {tab === "secrets" ? (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">环境变量状态（Vercel）</CardTitle>
              <CardDescription>密钥请在 Vercel 配置，此处仅显示是否已设置</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {envStatus ? (
                <>
                  <Badge variant={envStatus.deepseek ? "success" : "danger"}>DeepSeek</Badge>
                  <Badge variant={envStatus.qwen ? "success" : "danger"}>Qwen</Badge>
                  <Badge variant={envStatus.nowpayments ? "success" : "danger"}>NOWPayments</Badge>
                  <Badge variant={envStatus.resend ? "success" : "danger"}>Resend</Badge>
                  <Badge variant={envStatus.cron ? "success" : "danger"}>CRON_SECRET</Badge>
                </>
              ) : (
                <span className="text-slate-400">加载中…</span>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {(tab === "site" ? SITE_FIELDS.slice(0, 5) : SITE_FIELDS.slice(5)).map((field) => (
              <Card key={field.key} className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardDescription>{field.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  {field.type === "textarea" ? (
                    <textarea
                      value={config[field.key] ?? ""}
                      onChange={(e) => setConfig((p) => ({ ...p, [field.key]: e.target.value }))}
                      rows={3}
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                    />
                  ) : (
                    <Input
                      value={config[field.key] ?? ""}
                      onChange={(e) => setConfig((p) => ({ ...p, [field.key]: e.target.value }))}
                      disabled={loading}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button onClick={save} disabled={saving || loading}>{saving ? "保存中…" : "保存配置"}</Button>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
