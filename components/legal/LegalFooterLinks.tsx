import Link from "next/link";

export function LegalFooterLinks() {
  return (
    <>
      <Link href="/about" className="text-cyan-300 underline">
        关于我们
      </Link>
      {" · "}
      <Link href="/terms" className="text-cyan-300 underline">
        服务条款
      </Link>
      {" · "}
      <Link href="/privacy" className="text-cyan-300 underline">
        隐私政策
      </Link>
      {" · "}
      <Link href="/refund" className="text-cyan-300 underline">
        退款政策
      </Link>
      {" · "}
      <Link href="/policies/content" className="text-cyan-300 underline">
        内容政策
      </Link>
    </>
  );
}
