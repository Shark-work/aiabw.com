"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Heart, Loader2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  agentSlug: string;
  agentName: string;
  creatorUserId: string | null;
  creatorName: string | null;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  initialFollowing: boolean;
  canFollow: boolean;
};

export function AgentSocialActions({
  agentSlug,
  agentName,
  creatorUserId,
  creatorName,
  isLoggedIn,
  initialFavorited,
  initialFollowing,
  canFollow,
}: Props) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [following, setFollowing] = useState(initialFollowing);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingRemix, setLoadingRemix] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const requireLogin = () => {
    router.push(`/auth/login?next=${encodeURIComponent(`/agents/${agentSlug}`)}`);
  };

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    setLoadingFav(true);
    setMessage(null);
    const res = await fetch("/api/agents/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug, favorited: !favorited }),
    });
    const json = (await res.json()) as { ok: boolean; favorited?: boolean; error?: string; message?: string };
    setLoadingFav(false);
    if (json.ok) {
      setFavorited(Boolean(json.favorited));
      setMessage(json.message ?? null);
    } else {
      setMessage(json.error ?? "操作失败");
    }
  };

  const toggleFollow = async () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    if (!creatorUserId || !canFollow) return;
    setLoadingFollow(true);
    setMessage(null);
    const res = await fetch("/api/creator/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorUserId, following: !following }),
    });
    const json = (await res.json()) as { ok: boolean; following?: boolean; error?: string; message?: string };
    setLoadingFollow(false);
    if (json.ok) {
      setFollowing(Boolean(json.following));
      setMessage(json.message ?? null);
    } else {
      setMessage(json.error ?? "关注失败");
    }
  };

  const handleRemix = async () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    setLoadingRemix(true);
    setMessage(null);
    const res = await fetch(`/api/agents/remix?slug=${encodeURIComponent(agentSlug)}`);
    const json = (await res.json()) as { ok: boolean; editUrl?: string; error?: string };
    setLoadingRemix(false);
    if (json.ok && json.editUrl) {
      router.push(json.editUrl);
      return;
    }
    setMessage(json.error ?? "Remix 失败");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">社交 · Remix</div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={favorited ? "default" : "secondary"}
          disabled={loadingFav}
          onClick={() => void toggleFavorite()}
        >
          {loadingFav ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
          )}
          {favorited ? "已收藏" : "收藏"}
        </Button>

        {creatorUserId && canFollow ? (
          <Button
            size="sm"
            variant={following ? "secondary" : "outline"}
            disabled={loadingFollow}
            onClick={() => void toggleFollow()}
          >
            {loadingFollow ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : following ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {following ? "已关注" : "关注创作者"}
          </Button>
        ) : null}

        <Button size="sm" variant="outline" disabled={loadingRemix} onClick={() => void handleRemix()}>
          {loadingRemix ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          Remix
        </Button>
      </div>

      {creatorName && creatorUserId ? (
        <p className="text-xs text-slate-500">
          创作者 <span className="text-slate-300">{creatorName}</span>
        </p>
      ) : null}

      {!isLoggedIn ? (
        <p className="text-xs text-slate-500">
          <Link href={`/auth/login?next=/agents/${agentSlug}`} className="text-cyan-300 underline">
            登录
          </Link>
          后可收藏、关注与 Remix「{agentName}」
        </p>
      ) : null}

      {message ? <p className="text-xs text-cyan-200">{message}</p> : null}
    </div>
  );
}
