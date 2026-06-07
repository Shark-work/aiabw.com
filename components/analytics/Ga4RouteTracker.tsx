"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isGa4Enabled, trackPageView } from "@/lib/analytics";

/** App Router 路由切换时自动发送 page_view */
export function Ga4RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isGa4Enabled()) return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
