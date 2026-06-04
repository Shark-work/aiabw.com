import { Suspense } from "react";
import CheckoutClientPage from "./checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-8 text-sm text-slate-300">加载结账页中...</div>}>
      <CheckoutClientPage />
    </Suspense>
  );
}
