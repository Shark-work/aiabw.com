"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { buildAgentShareLink } from "@/lib/growth";

type AgentShareCardProps = {
  agentSlug: string;
  agentName: string;
};

export function AgentShareCard({ agentSlug, agentName }: AgentShareCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [inviteCode, setInviteCode] = useState("aiabw");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/invite/me")
      .then((r) => r.json())
      .then((json: { ok: boolean; code?: string }) => {
        if (json.ok && json.code) setInviteCode(json.code);
      })
      .catch(() => undefined);

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
    });
  }, [supabase]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = buildAgentShareLink(agentSlug, inviteCode, appUrl || "https://aiabw.com");
  const cardImageUrl = `/api/share-card/${agentSlug}?ref=${encodeURIComponent(inviteCode)}`;

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-[2rem] border border-violet-300/20 bg-violet-400/5 p-5">
      <div className="flex items-center gap-2 text-sm text-violet-100">
        <Share2 className="h-4 w-4" />
        溯源分享卡片 · 邀请码 {inviteCode}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardImageUrl}
          alt={`${agentName} 分享卡片`}
          className="w-full object-cover"
          loading="lazy"
        />
      </div>

      <p className="text-xs text-slate-400">
        分享卡片由后端生成并 CDN 缓存 7 天，同一 Agent+邀请码不会重复消耗算力。
      </p>

      <div className="break-all rounded-xl bg-black/30 p-3 text-xs text-slate-300">{shareLink}</div>

      <Button variant="secondary" className="w-full" onClick={() => void copyShare()}>
        <Copy className="h-4 w-4" />
        {copied ? "已复制分享链接" : "复制带溯源邀请码的链接"}
      </Button>
    </div>
  );
}
