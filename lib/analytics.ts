/** GA4 测量 ID — 生产环境通过 @next/third-parties 加载 */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-11LB54EX3D";

/** 仅在生产环境启用 GA4，避免开发数据污染 */
export function isGa4Enabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export const GA4_EVENTS = {
  AGENT_CARD_CLICK: "agent_card_click",
  PURCHASE_CLICK: "purchase_click",
  SUBSCRIBE_CLICK: "subscribe_click",
  PURCHASE_COMPLETE: "purchase_complete",
  LOGIN: "login",
  SIGNUP: "signup",
  CREATE_AGENT: "create_agent",
  PAGE_VIEW: "page_view",
} as const;

export type Ga4EventName = (typeof GA4_EVENTS)[keyof typeof GA4_EVENTS];

export type Ga4EventParams = Record<string, string | number | boolean>;

function cleanParams(params?: Ga4EventParams): Ga4EventParams | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ) as Ga4EventParams;
}

/**
 * 客户端事件上报（@next/third-parties sendGAEvent）。
 * 开发环境 no-op；生产环境需在 GoogleAnalytics 初始化后调用。
 */
export function trackEvent(event: Ga4EventName | string, params?: Ga4EventParams): void {
  if (!isGa4Enabled() || typeof window === "undefined") return;

  void import("@next/third-parties/google").then(({ sendGAEvent }) => {
    sendGAEvent("event", event, cleanParams(params) ?? {});
  });
}

/** App Router 路由切换时发送 page_view */
export function trackPageView(path: string): void {
  if (!isGa4Enabled() || typeof window === "undefined") return;

  void import("@next/third-parties/google").then(({ sendGAEvent }) => {
    sendGAEvent("config", GA_MEASUREMENT_ID, {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  });
}
