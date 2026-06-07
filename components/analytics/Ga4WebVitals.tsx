"use client";

import { useReportWebVitals } from "next/web-vitals";
import { isGa4Enabled } from "@/lib/analytics";

/** 将 Core Web Vitals 上报至 GA4 */
export function Ga4WebVitals() {
  useReportWebVitals((metric) => {
    if (!isGa4Enabled()) return;

    void import("@next/third-parties/google").then(({ sendGAEvent }) => {
      sendGAEvent("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
        non_interaction: true,
      });
    });
  });

  return null;
}
