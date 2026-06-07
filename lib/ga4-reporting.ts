import { BetaAnalyticsDataClient } from "@google-analytics/data";

export type Ga4TrendPoint = {
  day: string;
  sessions: number;
  pageViews: number;
};

export type Ga4DashboardData = {
  configured: boolean;
  error?: string;
  totalSessions: number;
  todaySessions: number;
  pageViews: number;
  uniqueUsers: number;
  avgSessionDurationSec: number;
  trend: Ga4TrendPoint[];
};

const EMPTY: Ga4DashboardData = {
  configured: false,
  totalSessions: 0,
  todaySessions: 0,
  pageViews: 0,
  uniqueUsers: 0,
  avgSessionDurationSec: 0,
  trend: [],
};

function parseMetric(row: { metricValues?: Array<{ value?: string | null } | null> | null } | undefined | null, index: number): number {
  const raw = row?.metricValues?.[index]?.value;
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function formatGaDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function getClient(): BetaAnalyticsDataClient | null {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!propertyId || !clientEmail || !privateKey) return null;

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

/** 服务端拉取 GA4 Data API 报表（Admin 仪表盘） */
export async function fetchGa4DashboardData(): Promise<Ga4DashboardData> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const client = getClient();

  if (!propertyId || !client) {
    return {
      ...EMPTY,
      error: "未配置 GA4_PROPERTY_ID / GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY",
    };
  }

  try {
    const [overviewRes, trendRes] = await Promise.all([
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          { startDate: "2020-01-01", endDate: "today", name: "all" },
          { startDate: "today", endDate: "today", name: "today" },
          { startDate: "7daysAgo", endDate: "today", name: "week" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "6daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const overview = overviewRes[0];
    const trendReport = trendRes[0];

    const rows = overview.rows ?? [];
    const allRow = rows[0];
    const todayRow = rows[1];
    const weekRow = rows[2];

    const totalSessions = parseMetric(allRow, 0);
    const todaySessions = parseMetric(todayRow, 0);
    const uniqueUsers = parseMetric(weekRow ?? allRow, 1);
    const pageViews = parseMetric(weekRow ?? allRow, 2);
    const avgSessionDurationSec = Math.round(parseMetric(weekRow ?? allRow, 3));

    const trend: Ga4TrendPoint[] = (trendReport.rows ?? []).map((row) => ({
      day: formatGaDate(row.dimensionValues?.[0]?.value ?? ""),
      sessions: parseMetric(row, 0),
      pageViews: parseMetric(row, 1),
    }));

    return {
      configured: true,
      totalSessions,
      todaySessions,
      pageViews,
      uniqueUsers,
      avgSessionDurationSec,
      trend,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GA4 报表拉取失败";
    return { ...EMPTY, configured: true, error: message };
  }
}
