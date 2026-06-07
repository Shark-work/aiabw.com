import Link from "next/link";
import { CURRENT_SITE_VERSION, LOCAL_VERSION_SHA, SITE_VERSION_HISTORY } from "@/lib/site-version";

export default function VersionPage() {
  const current = SITE_VERSION_HISTORY.find((item) => item.version === CURRENT_SITE_VERSION) ?? SITE_VERSION_HISTORY[0];
  const runtimeSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "unknown";
  const vercelEnv = process.env.VERCEL_ENV ?? "local";
  const deploymentTime = process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? process.env.VERCEL_REGION ?? "unknown";
  const isMatch = runtimeSha !== "unknown" && LOCAL_VERSION_SHA !== "local-dev" ? runtimeSha === LOCAL_VERSION_SHA : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-cyan-300/15 bg-white/5 p-8">
        <p className="text-sm text-cyan-300">版本详情页</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">AIABW 当前版本与历史更新</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          这个页面用于快速确认线上站点是否已经同步到最新版本，并查看历史更新说明、发布时间与变更摘要。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-cyan-100">
            当前版本：{CURRENT_SITE_VERSION}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300">
            最近更新：{current?.releasedAt ?? "unknown"}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300">
            运行环境：{vercelEnv}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300">
            最近部署：{deploymentTime}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">版本历史</h2>
        <div className="space-y-4">
          {SITE_VERSION_HISTORY.map((item, index) => (
            <article key={item.version} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{item.version}</h3>
                    {item.version === CURRENT_SITE_VERSION ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-100">
                        当前线上版本
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{item.releasedAt} · {item.label}</p>
                </div>
                <div className="text-sm text-slate-500">#{SITE_VERSION_HISTORY.length - index}</div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {item.notes.map((note) => (
                  <li key={note} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    {note}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium text-white">当前线上版本 vs 本地版本</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span>线上版本号</span>
              <span className="text-cyan-200">{CURRENT_SITE_VERSION}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span>本地 Git SHA</span>
              <span className="break-all text-violet-200">{LOCAL_VERSION_SHA}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span>线上 Git SHA</span>
              <span className="break-all text-violet-200">{runtimeSha}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span>是否一致</span>
              <span className={isMatch === null ? "text-slate-400" : isMatch ? "text-emerald-300" : "text-red-300"}>
                {isMatch === null ? "无法判断" : isMatch ? "一致" : "不一致"}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            说明：如果线上 SHA 与本地 SHA 不一致，通常意味着当前生产站点还不是你正在看的这份构建。
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium text-white">如何用它判断是否上线成功</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>如果生产环境显示的版本号不是这里的最新版本，说明部署没有同步到当前站点。</li>
            <li>如果版本号对了但某个页面还是 404，说明问题在路由或部署缓存。</li>
            <li>如果版本号正确且页面正常打开，说明当前生产站点已经同步到这次更新。</li>
            <li>如果线上 Git SHA 与本地 Git SHA 不一致，说明部署版本和本地预期不一致。</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium text-white">环境与部署信息</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div>运行环境：{vercelEnv}</div>
            <div>最近部署：{deploymentTime}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium text-white">快捷入口</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/" className="rounded-full bg-cyan-300 px-4 py-2 font-medium text-slate-950">
              返回首页
            </Link>
            <Link href="/diagnostics" className="rounded-full border border-white/10 px-4 py-2 text-white">
              打开诊断页
            </Link>
            <Link href="/admin/health" className="rounded-full border border-white/10 px-4 py-2 text-white">
              打开后台诊断页
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
