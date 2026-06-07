"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REF_COOKIE = "aiabw_ref";
const REF_STORAGE = "aiabw_ref_code";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const normalized = ref.trim().toLowerCase();
    document.cookie = `${REF_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    localStorage.setItem(REF_STORAGE, normalized);
  }, [searchParams]);

  return null;
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REF_STORAGE);
}
