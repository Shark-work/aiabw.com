"use client";

import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID, isGa4Enabled } from "@/lib/analytics";
import { Ga4RouteTracker } from "@/components/analytics/Ga4RouteTracker";
import { Ga4WebVitals } from "@/components/analytics/Ga4WebVitals";

/** 生产环境 GA4 根组件：脚本注入 + 路由 page_view + Web Vitals */
export function Ga4Root() {
  if (!isGa4Enabled()) return null;

  return (
    <>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <Suspense fallback={null}>
        <Ga4RouteTracker />
      </Suspense>
      <Ga4WebVitals />
    </>
  );
}
