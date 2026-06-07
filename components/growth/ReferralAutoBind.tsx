"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getStoredReferralCode } from "@/components/growth/ReferralCapture";

/** 登录后自动绑定邀请关系（每人仅一次） */
export function ReferralAutoBind() {
  const tried = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const tryBind = async () => {
      if (tried.current) return;
      const code = getStoredReferralCode();
      if (!code) return;

      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      tried.current = true;

      await fetch("/api/invite/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      }).catch(() => undefined);
    };

    void tryBind();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        tried.current = false;
        void tryBind();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
