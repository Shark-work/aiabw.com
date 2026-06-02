import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "关于" },
  { href: "/agents", label: "AI Agents" },
  { href: "/docs", label: "文档" },
  { href: "/contact", label: "联系" },
];

export function Footer() {
  return (
    <footer className="border-t border-cyan-400/15 bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-base font-semibold tracking-[0.24em] text-white">
            艾比世界
          </div>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            AIABW · 全球最有趣的 AI Agent 游乐场。
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {footerLinks.map((item) => (
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
    </footer>
  );
}

// TODO: Add social links, legal links, and status indicators.
