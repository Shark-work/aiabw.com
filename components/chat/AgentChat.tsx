"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypewriterText } from "@/components/chat/TypewriterText";
import { UpgradeProModal } from "@/components/chat/UpgradeProModal";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animate?: boolean;
};

type AgentChatProps = {
  agentSlug: string;
  agentName: string;
  isLoggedIn: boolean;
  initialRemaining?: number;
  initialLimit?: number;
  ownsAgent?: boolean;
  isPro?: boolean;
};

export function AgentChat({
  agentSlug,
  agentName,
  isLoggedIn,
  initialRemaining = 3,
  initialLimit = 3,
  ownsAgent = false,
  isPro = false,
}: AgentChatProps) {
  const unlimited = ownsAgent || isPro;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `✨ 欢迎来到 ${agentName} 的霓虹聊天室。今天想玩什么？`,
      animate: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [limit, setLimit] = useState(initialLimit);
  const [proActive, setProActive] = useState(isPro);
  const [llmModelLabel, setLlmModelLabel] = useState(isPro ? "Claude Sonnet" : "Claude Haiku");
  const [typingId, setTypingId] = useState<string | null>("welcome");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/trial?agentSlug=${encodeURIComponent(agentSlug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (json: {
          remaining?: number;
          limit?: number;
          isPro?: boolean;
          unlimited?: boolean;
          llmModelLabel?: string;
        }) => {
          if (typeof json.remaining === "number") setRemaining(json.remaining);
          if (typeof json.limit === "number") setLimit(json.limit);
          if (json.isPro) setProActive(true);
          if (json.llmModelLabel) setLlmModelLabel(json.llmModelLabel);
        }
      )
      .catch(() => undefined);
  }, [agentSlug, isLoggedIn]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!isLoggedIn) {
      setError("请先登录后再试用聊天。");
      return;
    }

    if (!unlimited && !proActive && remaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setError(null);
    setInput("");
    setLoading(true);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const history = [...messages, userMsg]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug, message: text, history }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { reply: string; cached?: boolean; modelLabel?: string };
        remaining?: number;
        limit?: number;
        isPro?: boolean;
        unlimited?: boolean;
        quotaExceeded?: boolean;
        requireUpgrade?: boolean;
        llmModelLabel?: string;
      };

      if (!res.ok || !json.ok) {
        if (json.quotaExceeded || json.requireUpgrade) {
          setShowUpgradeModal(true);
          setRemaining(0);
        }
        setError(json.error ?? "发送失败");
        if (typeof json.remaining === "number") setRemaining(json.remaining);
        if (typeof json.limit === "number") setLimit(json.limit);
        setLoading(false);
        return;
      }

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: json.data?.reply ?? "…", animate: true },
      ]);
      setTypingId(assistantId);

      if (typeof json.remaining === "number") setRemaining(json.remaining);
      if (typeof json.limit === "number") setLimit(json.limit);
      if (json.isPro || json.unlimited) setProActive(true);
      if (json.llmModelLabel) setLlmModelLabel(json.llmModelLabel);
      if (json.data?.modelLabel) setLlmModelLabel(String(json.data.modelLabel));
    } catch {
      setError("网络错误，请稍后重试。");
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <UpgradeProModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} limit={limit} />

      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(6,12,28,0.95),rgba(4,8,20,0.98))] shadow-[0_0_80px_rgba(0,245,255,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,255,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,245,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px animate-pulse bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="relative border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10">
                <div className="absolute inset-0 animate-ping rounded-2xl border border-cyan-400/20 opacity-30" />
                <Sparkles className="relative h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{agentName}</div>
                <div className="flex items-center gap-2 text-xs text-cyan-200/70">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {llmModelLabel} · 赛博梦幻
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {unlimited || proActive ? (
                <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-violet-100">
                  <Zap className="mr-1 inline h-3 w-3" />
                  Pro · 无限试用
                </span>
              ) : ownsAgent ? (
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                  已拥有 · 无限畅聊
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => remaining <= 0 && setShowUpgradeModal(true)}
                  className={cn(
                    "rounded-full border px-3 py-1 transition",
                    remaining <= 0
                      ? "border-amber-300/40 bg-amber-400/10 text-amber-100"
                      : "border-violet-300/30 bg-violet-400/10 text-violet-100"
                  )}
                >
                  <Zap className="mr-1 inline h-3 w-3" />
                  今日剩余 {remaining}/{limit}
                </button>
              )}
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="relative max-h-[420px] min-h-[320px] space-y-4 overflow-y-auto px-5 py-5 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-lg",
                  msg.role === "user"
                    ? "border-violet-300/25 bg-violet-500/15 text-violet-50 shadow-violet-500/5"
                    : "border-cyan-300/20 bg-cyan-400/10 text-cyan-50 shadow-cyan-500/5"
                )}
              >
                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] opacity-60">
                  {msg.role === "user" ? "你" : agentName}
                </div>
                {msg.role === "assistant" && msg.animate && typingId === msg.id ? (
                  <TypewriterText
                    text={msg.content}
                    speed={14}
                    onComplete={() => {
                      if (typingId === msg.id) setTypingId(null);
                    }}
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200/90">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              <span className="bg-gradient-to-r from-cyan-200 to-violet-200 bg-clip-text text-transparent">
                {agentName} 正在霓虹通道中回复…
              </span>
            </div>
          ) : null}
        </div>

        <div className="relative border-t border-white/10 px-5 py-4">
          {!isLoggedIn ? (
            <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              登录后即可试用聊天（免费用户每日 3 次）。
              <Link href="/auth/login" className="ml-2 text-cyan-300 underline">
                去登录
              </Link>
            </div>
          ) : null}

          {error ? (
            <div className="mb-3 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
              {error.includes("试用") || error.includes("Pro") ? (
                <button
                  type="button"
                  className="ml-2 text-cyan-300 underline"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  升级 Pro
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={
                !isLoggedIn
                  ? "请先登录…"
                  : unlimited || proActive || remaining > 0
                    ? "输入消息，Enter 发送…"
                    : "今日试用已用完，升级 Pro 继续…"
              }
              disabled={!isLoggedIn || loading}
              className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40 focus:shadow-[0_0_20px_rgba(0,245,255,0.15)] disabled:opacity-50"
            />
            <Button
              onClick={() => void sendMessage()}
              disabled={!isLoggedIn || loading || !input.trim()}
              className="shadow-[0_0_24px_rgba(0,245,255,0.2)]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            DeepSeek / Claude Haiku 驱动 · 内容经 AI 审核 ·
            <Link href="/policies/content" className="text-cyan-400/80 underline">
              《内容政策》
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
