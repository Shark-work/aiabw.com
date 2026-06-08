"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HealthResult = {
  ok: boolean;
  status: number;
  stage?: string;
  hint?: string;
  runtimeMs?: number;
  env?: Record<string, boolean>;
  db?: {
    profilesCount?: number | null;
    agentsCount?: number | null;
    profilesError?: string | null;
    agentsError?: string | null;
  };
};

type ClientSignal = {
  route: string;
  href: string;
  userAgent: string;
  hasWindow: boolean;
  hasDocument: boolean;
  online: boolean;
  localStorageAvailable: boolean;
  cookiesEnabled: boolean;
  nextHydrationPresent: boolean;
};

type ConsoleEntry = {
  level: "log" | "warn" | "error" | "info";
  message: string;
};

type RouteEntry = {
  kind: string;
  target: string;
  source?: string;
};

function safeLocalStorage(): boolean {
  try {
    const key = "__aiabw_diag__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(path: string): Promise<HealthResult | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    return (await res.json()) as HealthResult;
  } catch {
    return null;
  }
}

export function DiagnosticsClient() {
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState<HealthResult | null>(null);
  const [routeHealth, setRouteHealth] = useState<HealthResult | null>(null);
  const [apiHealth, setApiHealth] = useState<HealthResult | null>(null);
  const [consoleLog, setConsoleLog] = useState<ConsoleEntry[]>([]);
  const [capturedErrors, setCapturedErrors] = useState<string[]>([]);
  const [fetchLog, setFetchLog] = useState<string[]>([]);
  const [routeLog, setRouteLog] = useState<RouteEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const clientSignals: ClientSignal = useMemo(
    () => ({
      route: typeof window !== "undefined" ? window.location.pathname : "",
      href: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      hasWindow: typeof window !== "undefined",
      hasDocument: typeof document !== "undefined",
      online: typeof navigator !== "undefined" ? navigator.onLine : false,
      localStorageAvailable: typeof window !== "undefined" ? safeLocalStorage() : false,
      cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
      nextHydrationPresent:
        typeof document !== "undefined"
          ? Boolean(document.querySelector("#__next") || document.querySelector("[data-nextjs-reactroot]"))
          : false,
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const [serverData, routeData, apiData] = await Promise.all([
        fetchJson("/api/admin/health"),
        fetchJson("/admin/health"),
        fetchJson("/api/diagnostics/report"),
      ]);
      if (!mounted) return;
      setServer(serverData);
      setRouteHealth(routeData);
      setApiHealth(apiData);
      setLoading(false);
    };

    void run();

    const trackedFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof window.fetch>) => {
      const input = args[0];
      const resource = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      const started = performance.now();
      try {
        const response = await trackedFetch(...args);
        const elapsed = Math.round(performance.now() - started);
        setFetchLog((prev) => [...prev.slice(-29), `[fetch] ${response.status} ${resource} (${elapsed}ms)`]);
        return response;
      } catch (error) {
        const elapsed = Math.round(performance.now() - started);
        const reason = error instanceof Error ? error.message : String(error);
        setFetchLog((prev) => [...prev.slice(-29), `[fetch-error] ${resource} (${elapsed}ms) ${reason}`]);
        throw error;
      }
    };

    const pushConsole = (level: ConsoleEntry["level"], args: unknown[]) => {
      const message = args
        .map((arg) => {
          if (typeof arg === "string") return arg;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");
      setConsoleLog((prev) => [...prev.slice(-24), { level, message }]);
    };

    const pushRoute = (type: string, target: string) => {
      const stack = new Error().stack
        ?.split("\n")
        .slice(2, 6)
        .map((line) => line.trim())
        .join(" | ");
      setRouteLog((prev) => [...prev.slice(-29), { kind: type, target, source: stack }]);
    };

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = function (...args) {
      const target = String(args[2] ?? window.location.href);
      pushRoute("pushState", target);
      return originalPushState(...args);
    };
    history.replaceState = function (...args) {
      const target = String(args[2] ?? window.location.href);
      pushRoute("replaceState", target);
      return originalReplaceState(...args);
    };
    const onPopState = () => pushRoute("popstate", window.location.href);
    window.addEventListener("popstate", onPopState);

    const originalLog = console.log.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalInfo = console.info.bind(console);

    console.log = (...args: unknown[]) => {
      pushConsole("log", args);
      originalLog(...args);
    };
    console.warn = (...args: unknown[]) => {
      pushConsole("warn", args);
      originalWarn(...args);
    };
    console.error = (...args: unknown[]) => {
      pushConsole("error", args);
      originalError(...args);
    };
    console.info = (...args: unknown[]) => {
      pushConsole("info", args);
      originalInfo(...args);
    };

    const onError = (event: ErrorEvent) => {
      setCapturedErrors((prev) => [...prev.slice(-19), `[error] ${event.message} @ ${event.filename}:${event.lineno}:${event.colno}`]);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      setCapturedErrors((prev) => [...prev.slice(-19), `[rejection] ${reason}`]);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      mounted = false;
      window.fetch = trackedFetch;
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const healthData = apiHealth;

  const report = {
    timestamp: new Date().toISOString(),
    clientSignals,
    server,
    routeHealth,
    apiHealth,
    healthData,
    consoleLog,
    capturedErrors,
    fetchLog,
    routeLog,
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dbSummary = healthData?.db
    ? [
        { key: "profilesCount", value: String(healthData.db.profilesCount ?? "null") },
        { key: "agentsCount", value: String(healthData.db.agentsCount ?? "null") },
        { key: "profilesError", value: healthData.db.profilesError ?? "null" },
        { key: "agentsError", value: healthData.db.agentsError ?? "null" },
      ]
    : [];

  const envSummary = healthData?.env ? Object.entries(healthData.env).map(([key, value]) => ({ key, value: value ? "通过" : "失败" })) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm text-cyan-300">AIABW 线上诊断工具</p>
        <h1 className="text-3xl font-semibold text-white">自检报告生成器</h1>
        <p className="text-slate-400">打开这个页面后，它会自动检查路由、API、服务端健康信息、前端报错与控制台日志，并生成一份可复制的诊断报告。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard label="页面路由" value={clientSignals.route || "unknown"} ok={routeHealth?.ok ?? true} />
        <StatusCard label="API 健康" value={apiHealth?.ok ? `HTTP ${apiHealth.status}` : "unknown"} ok={apiHealth?.ok ?? true} />
        <StatusCard label="服务端健康" value={server?.ok ? `HTTP ${server.status}` : "unknown"} ok={server?.ok ?? true} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="客户端状态">
          <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">{JSON.stringify(clientSignals, null, 2)}</pre>
        </Section>
        <Section title="服务端摘要">
          <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">{JSON.stringify({ server, routeHealth, apiHealth, healthData }, null, 2)}</pre>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="环境变量摘要">
          {envSummary.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有拿到环境变量摘要。</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {envSummary.map((row) => (
                <div key={row.key} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                  <span className="text-slate-500">{row.key}：</span>
                  <span className={row.value === "通过" ? "text-emerald-300" : "text-red-300"}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="数据库诊断摘要">
          {dbSummary.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有拿到数据库摘要。</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {dbSummary.map((row) => (
                <div key={row.key} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                  <span className="text-slate-500">{row.key}：</span>
                  <span className="text-cyan-200">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="最近控制台日志">
        {consoleLog.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有捕获到 console 日志。</div>
        ) : (
          <div className="space-y-2">
            {consoleLog.map((entry, index) => (
              <div
                key={`${entry.level}-${index}-${entry.message}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  entry.level === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : entry.level === "warn"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
                      : "border-white/10 bg-black/20 text-slate-300"
                }`}
              >
                [{entry.level}] {entry.message}
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="最近路由跳转记录">
          {routeLog.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有捕获到路由跳转。</div>
          ) : (
            <div className="space-y-2">
              {routeLog.map((line, index) => (
                <div key={`${line.kind}-${line.target}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-violet-200">
                  <div className="font-medium">{line.kind} → {line.target}</div>
                  {line.source ? <div className="mt-1 text-xs text-slate-400">source: {line.source}</div> : null}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="最近运行时报错">
          {capturedErrors.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有捕获到前端错误。</div>
          ) : (
            <div className="space-y-2">
              {capturedErrors.map((line) => (
                <div key={line} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-red-200">
                  {line}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="最近 fetch 请求日志">
          {fetchLog.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">当前没有捕获到 fetch 请求。</div>
          ) : (
            <div className="space-y-2">
              {fetchLog.map((line) => (
                <div key={line} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-cyan-200">
                  {line}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="复制给我排查">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void copyReport()}>{copied ? "已复制" : "复制完整报告"}</Button>
          <Button variant="secondary" asChild>
            <Link href="/admin/health">打开后台诊断页</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/api/diagnostics/report">查看纯 JSON 报告</Link>
          </Button>
        </div>
      </Section>

      <Section title="使用说明">
        <ul className="space-y-2 text-sm text-slate-300">
          <li>1. 打开此页面，等 2-3 秒让它自动采集信息。</li>
          <li>2. 如果页面本身都打不开，说明路由层出问题。</li>
          <li>3. 把“复制完整报告”的内容发给我，我可以直接根据结果定位问题。</li>
        </ul>
      </Section>

      {loading ? <div className="text-sm text-slate-500">正在收集诊断信息...</div> : null}
    </div>
  );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-400">{label}</div>
        <div className={ok ? "text-emerald-300" : "text-red-300"}>{ok ? "通过" : "失败"}</div>
      </div>
      <div className="mt-3 break-all text-lg text-white">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-3 text-lg font-medium text-white">{title}</h2>
      {children}
    </div>
  );
}
