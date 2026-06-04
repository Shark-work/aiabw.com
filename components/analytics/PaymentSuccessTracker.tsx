"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { GA4_EVENTS, trackEvent } from "@/lib/analytics";

function PaymentSuccessTrackerInner() {
  const params = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (params.get("payment") !== "success") return;

    fired.current = true;
    trackEvent(GA4_EVENTS.PURCHASE_COMPLETE, {
      order_id: params.get("order_id") ?? "",
      plan: params.get("plan") ?? "",
      source: "return_url",
    });
  }, [params]);

  return null;
}

/** 支付成功回跳页面上报 purchase_complete（仅一次） */
export function PaymentSuccessTracker() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessTrackerInner />
    </Suspense>
  );
}
