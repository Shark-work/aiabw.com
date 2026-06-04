export const REFERRAL_COMMISSION_RATE = 0.1;
export const CREATOR_SHARE_RATE = 0.7;
export const PLATFORM_SHARE_RATE = 0.3;
export const MIN_CREATOR_WITHDRAWAL_USDT = 10;

export const CACHE_KEYS = {
  homeStats: "home:stats",
  leaderboardWeekly: "leaderboard:weekly",
  searchPrefix: "search:",
  shareCardPrefix: "share_card:",
  referralStatsPrefix: "referral_stats:",
} as const;

export const CACHE_TTL = {
  homeStats: 15 * 60,
  leaderboard: 60 * 60,
  search: 5 * 60,
  shareCard: 7 * 24 * 60 * 60,
  referralStats: 10 * 60,
} as const;

export function generateInviteCode(userId: string): string {
  const base = userId.replace(/-/g, "").slice(0, 6);
  const rand = Math.random().toString(36).slice(2, 6);
  return `ai${base}${rand}`.toLowerCase().slice(0, 12);
}

export function buildInviteLink(code: string, appUrl: string): string {
  return `${appUrl}/?ref=${encodeURIComponent(code)}`;
}

export function buildAgentShareLink(slug: string, inviteCode: string, appUrl: string): string {
  return `${appUrl}/agents/${slug}?ref=${encodeURIComponent(inviteCode)}`;
}
