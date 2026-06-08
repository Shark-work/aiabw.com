import Link from "next/link";
import { FooterViewCount } from "@/components/layout/FooterViewCount";
import { CURRENT_SITE_VERSION } from "@/lib/site-version";

const mainLinks = [
  { href: "/about", label: "关于" },
  { href: "/explore", label: "探索" },
  { href: "/agents", label: "AI Agents" },
  { href: "/leaderboard", label: "排行榜" },
  { href: "/creator", label: "创作者" },
  { href: "/pro", label: "Pro" },
];

const legalLinks = [
  { href: "/terms", label: "服务条款" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/refund", label: "退款政策" },
  { href: "/policies/content", label: "内容政策" },
];

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@aiabw.com";

export function Footer() {
  return (
    <footer className="border-t border-cyan-400/15 bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-base font-semibold tracking-[0.24em] text-white">艾比世界</div>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              AIABW · 全球最有趣的 AI Agent 游乐场。
            </p>
            <FooterViewCount />
            <a
              href={`mailto:${contactEmail}`}
              className="mt-2 block text-xs text-slate-500 transition hover:text-cyan-200"
            >
              联系：{contactEmail}
            </a>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">导航</div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                {mainLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">法律与合规</div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                {legalLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-violet-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 text-center text-xs text-slate-600">
          <div className="flex flex-col items-center gap-2">
            <div>
              © {new Date().getFullYear()} AIABW · aiabw.com · 版权所有 · AIABW 艾比世界原创内容受保护
            </div>
            <Link
              href="/version"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              版本 {CURRENT_SITE_VERSION}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
