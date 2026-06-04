import { redirect } from "next/navigation";

/** 会员定价统一跳转 Pro 订阅页 */
export default function PricingPage() {
  redirect("/pro");
}
