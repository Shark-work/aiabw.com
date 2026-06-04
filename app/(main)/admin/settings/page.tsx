"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type SiteConfig = {
  site_name: string;
  site_url: string;
  default_language: string;
  payment_provider: string;
  ga4_id: string;
};

const defaultConfig: SiteConfig = {
  site_name: "AIABW · 艾比世界",
  site_url: "https://aiabw.com",
  default_language: "zh-CN",
  payment_provider: "NOWPayments",
  ga4_id: "G-11LB54EX3D",
};

const fields: Array<{ key: keyof SiteConfig; label: string; placeholder: string }> = [
  { key: "site_name", label: "站点名称", placeholder: "AIABW · 艾比世界" },
  { key: "site_url", label: "正式域名", placeholder: "https://aiabw.com" },
  { key: "default_language", label: "默认语言", placeholder: "zh-CN" },
  { key: "payment_provider", label: "支付供应商", placeholder: "NOWPayments" },
  { key: "ga4_id", label: "GA4 ID", placeholder: "G-XXXXXXXXXX" },
];

export default function AdminSettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/site-settings", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; config?: SiteConfig; error?: string };
      if (res.ok && json.ok && json.config) {
        setConfig(json.config);
      }
      setLoading(false);
    })();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    const json = (await res.json()) as { ok: boolean; config?: SiteConfig; error?: string };
    if (!res.ok || !json.ok) {
      setMessage(json.error ?? "保存失败");
      setSaving(false);
      return;
    }

    if (json.config) setConfig(json.config);
    setMessage("站点配置已保存到 Supabase site_settings 表。");
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <h1 className="text-4xl font-semibold text-white">站点配置</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          这里是运营阶段最常用的配置入口。现在已接入 Supabase 的 `site_settings` 持久化表。
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {fields.map((field) => (
          <Card key={field.key} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>{field.label}</CardDescription>
              <CardTitle className="text-white">{config[field.key]}</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                value={config[field.key]}
                onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                disabled={loading}
              />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>编辑配置</CardDescription>
            <CardTitle className="text-white">保存到数据库</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              你修改后点击保存，会写入 `site_settings` 表。后续你也可以把首页、SEO 和支付开关都放到这里统一管理。
            </p>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? "保存中..." : loading ? "加载中..." : "保存配置"}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/admin">返回后台首页</Link>
              </Button>
            </div>

            {message ? <p className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>上线核对项</CardDescription>
            <CardTitle className="text-white">Vercel / Supabase / NOWPayments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>1. `NEXT_PUBLIC_APP_URL = https://aiabw.com`</p>
            <p>2. Supabase Site URL = `https://aiabw.com`</p>
            <p>3. Redirect URLs 包含 `/auth/login`、`/account`</p>
            <p>4. NOWPayments webhook = `/api/nowpayments/webhook`</p>
            <p>5. GA4 ID = `G-11LB54EX3D`</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
