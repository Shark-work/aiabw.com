"use client";

import { Suspense } from "react";
import { ReferralAutoBind } from "@/components/growth/ReferralAutoBind";
import { ReferralCapture } from "@/components/growth/ReferralCapture";

export function GrowthProviders() {
  return (
    <Suspense fallback={null}>
      <ReferralCapture />
      <ReferralAutoBind />
    </Suspense>
  );
}
