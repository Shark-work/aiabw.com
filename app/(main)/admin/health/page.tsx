import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminPage } from "@/lib/admin-auth";

async function checkApi(path: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${path}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

export default async function AdminHealthPage() {
  const auth = await requireAdminPage();
  const supabase = await createSupabaseServerClient();

  const [{ data: sessionData }, apiHealth, apiHealthSelf] = await Promise.all([
    supabase.auth.getSession(),
    checkApi("/api/admin/health"),
    checkApi("/admin/health"),
  ]);

  const userId = sessionData.session?.user.id ?? null;
  const healthData = apiHealth.json as
    | {
        ok?: boolean;
        runtimeMs?: number;
        env?: Record<string, boolean>;
        db?: { profilesCount?: number | null; agentsCount?: number | null; profilesError?: string | null; agentsError?: string | null };
        stage?: string;
        hint?: string;
      }
    | null;

  const checks = [
    { label: "路由存在", value: apiHealthSelf.status !== 0, detail: "/admin/health 已被 Next.js 解析" },
    { label: "会话存在", value: Boolean(userId), detail: userId ? `user_id: ${userId}` : "未检测到登录会话" },
    { label: "管理员权限", value: !("redirect" in auth), detail: "通过 requireAdminPage() 判断" },
    { label: "后台 API 可达", value: apiHealth.ok, detail: `GET /api/admin/health → ${apiHealth.status || "network error"}` },
  ];

  const envRows = healthData?.env
    ? Object.entries(healthData.env).map(([key, value]) => ({ key, value: value ? "通过" : "失败" }))
    : [];

  const dbRows = healthData?.db
    ? [
        { key: "profilesCount", value: String(healthData.db.profilesCount ?? "null") },
        { key: "agentsCount", value: String(healthData.db.agentsCount ?? "null") },
        { key: "profilesError", value: healthData.db.profilesError ?? "null" },
        { key: "agentsError", value: healthData.db.agentsError ?? "null" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm text-cyan-300">Admin 路由线上诊断页</p>
        <h1 className="text-3xl font-semibold text-white">/admin 健康检查</h1>
        <p className="text-slate-400">
          如果你在生产环境看见 404、跳转异常或白屏，这一页可以帮助区分是“路由没部署、鉴权没通过，还是 API 挂了”。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-medium text-white">{item.label}</h2>
              <span className={item.value ? "text-emerald-300" : "text-red-300"}>
                {item.value ? "通过" : "失败"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300/15 bg-black/20 p-5 text-sm text-slate-300">
          <p className="mb-2 text-white">快速判断</p>
          <ul className="space-y-2">
            <li>如果这里都打不开，说明路由没有部署到当前生产站点。</li>
            <li>如果这里能打开，但显示未登录/无权限，说明 admin 账号或 session 有问题。</li>
            <li>如果这里能打开，但后台 API 失败，说明 API/数据库/环境变量有问题。</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p className="mb-2 text-white">实时诊断摘要</p>
          <div className="space-y-2">
            <div>运行耗时：{healthData?.runtimeMs ?? "unknown"} ms</div>
            <div>API 阶段：{healthData?.stage ?? "ok"}</div>
            <div>提示信息：{healthData?.hint ?? "none"}</div>
          </div>
        </div>
      </div>

      {envRows.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-lg font-medium text-white">环境变量诊断</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {envRows.map((row) => (
              <div key={row.key} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm text-slate-300">
                <span className="text-slate-500">{row.key}：</span>
                <span className={row.value === "通过" ? "text-emerald-300" : "text-red-300"}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dbRows.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-lg font-medium text-white">数据库诊断摘要</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {dbRows.map((row) => (
              <div key={row.key} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm text-slate-300">
                <span className="text-slate-500">{row.key}：</span>
                <span className="text-cyan-200">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/admin" className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950">
          返回后台首页
        </Link>
        <Link href="/auth/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
          去登录页
        </Link>
      </div>
    </div>
  );
}
