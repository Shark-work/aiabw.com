import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-constants";

type Admin = SupabaseClient<Database>;

function parseMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

export async function fetchAdminUsers(
  admin: Admin,
  opts: { page: number; q?: string; role?: string; sub?: string }
) {
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin
    .from("profiles")
    .select("user_id, username, display_name, role, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.role) query = query.eq("role", opts.role as "user");
  if (opts.q) query = query.or(`username.ilike.%${opts.q}%,display_name.ilike.%${opts.q}%`);

  const { data: profiles, count, error } = await query.range(from, to);
  if (error) throw error;

  const userIds = (profiles ?? []).map((p) => p.user_id);
  const emailMap = new Map<string, { email: string | null; lastSignIn: string | null }>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emailMap.set(id, { email: data.user?.email ?? null, lastSignIn: data.user?.last_sign_in_at ?? null });
    })
  );

  const { data: subs } = userIds.length
    ? await admin.from("subscriptions").select("user_id, status").in("user_id", userIds)
    : { data: [] };
  const subMap = new Map((subs ?? []).map((s) => [s.user_id, s.status]));

  let rows = (profiles ?? []).map((p) => ({
    userId: p.user_id,
    username: p.username,
    displayName: p.display_name,
    email: emailMap.get(p.user_id)?.email ?? null,
    role: p.role,
    banned: parseMeta(p.metadata).banned === true,
    createdAt: p.created_at,
    lastSignIn: emailMap.get(p.user_id)?.lastSignIn ?? null,
    subscriptionStatus: subMap.get(p.user_id) ?? "none",
  }));

  if (opts.sub === "active") rows = rows.filter((r) => r.subscriptionStatus === "active");
  if (opts.sub === "none") rows = rows.filter((r) => r.subscriptionStatus === "none");

  return { rows, total: count ?? 0 };
}

export async function fetchAdminAgents(
  admin: Admin,
  opts: { page: number; q?: string; status?: string }
) {
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin
    .from("agents")
    .select(
      "id, slug, name, status, created_by, created_at, metadata, category_id, sales_count, is_featured, moderation_status",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status as "active");
  if (opts.q) query = query.or(`name.ilike.%${opts.q}%,slug.ilike.%${opts.q}%`);

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const creatorIds = [...new Set((data ?? []).map((a) => a.created_by).filter(Boolean))] as string[];
  const { data: creators } = creatorIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", creatorIds)
    : { data: [] };
  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c.display_name ?? c.username ?? "—"]));

  const categoryIds = [...new Set((data ?? []).map((a) => a.category_id).filter(Boolean))] as string[];
  const { data: categories } = categoryIds.length
    ? await admin.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] };
  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const rows = (data ?? []).map((a) => {
    const meta = parseMeta(a.metadata);
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      creator: a.created_by ? creatorMap.get(a.created_by) ?? "—" : "—",
      category: a.category_id ? catMap.get(a.category_id) ?? "—" : "—",
      priceUsdt: meta.price_usdt ?? 0,
      status: a.status,
      moderationStatus: (a as { moderation_status?: string }).moderation_status ?? "approved",
      isFeatured: Boolean((a as { is_featured?: boolean }).is_featured),
      sales: Number((a as { sales_count?: number }).sales_count ?? 0),
      createdAt: a.created_at,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function fetchAdminOrders(
  admin: Admin,
  opts: { page: number; q?: string; status?: string }
) {
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin
    .from("transactions")
    .select("id, order_id, user_id, plan_slug, order_type, payment_status, price_amount, price_currency, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("payment_status", opts.status as "pending");
  if (opts.q) query = query.ilike("order_id", `%${opts.q}%`);

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []).map((t) => ({
      id: t.id,
      orderId: t.order_id,
      userId: t.user_id,
      productType: t.order_type === "agent" ? "Agent" : "订阅",
      planSlug: t.plan_slug,
      amount: t.price_amount,
      currency: t.price_currency,
      status: t.payment_status,
      createdAt: t.created_at,
    })),
    total: count ?? 0,
  };
}

export async function fetchAdminSubscriptions(admin: Admin, opts: { page: number; status?: string }) {
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin
    .from("subscriptions")
    .select("id, user_id, status, current_period_end, created_at, subscription_plans(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status as "active");

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const userIds = [...new Set((data ?? []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id, display_name, username").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.username ?? "—"]));

  return {
    rows: (data ?? []).map((s) => {
      const plan = s.subscription_plans as { name?: string; slug?: string } | null;
      return {
        id: s.id,
        userId: s.user_id,
        userName: nameMap.get(s.user_id) ?? "—",
        planName: plan?.name ?? "—",
        planSlug: plan?.slug ?? "—",
        status: s.status,
        periodEnd: s.current_period_end,
        createdAt: s.created_at,
      };
    }),
    total: count ?? 0,
  };
}

export async function fetchAdminWithdrawals(admin: Admin, opts: { page: number; status?: string }) {
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const [creator, referral] = await Promise.all([
    admin
      .from("creator_withdrawals")
      .select("id, user_id, amount_usd, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    admin
      .from("referral_withdrawals")
      .select("id, user_id, amount_usd, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const merged = [
    ...(creator.data ?? []).map((w) => ({ ...w, walletType: "creator" as const })),
    ...(referral.data ?? []).map((w) => ({ ...w, walletType: "referral" as const })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return { rows: merged.slice(0, ADMIN_PAGE_SIZE), total: (creator.count ?? 0) + (referral.count ?? 0) };
}

export async function fetchAdminModerationPending(admin: Admin, page: number) {
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const { data, count, error } = await admin
    .from("agents")
    .select("id, slug, name, description, created_by, created_at, status, moderation_status", { count: "exact" })
    .or("moderation_status.eq.pending,status.eq.draft")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    const fb = await admin
      .from("agents")
      .select("id, slug, name, description, created_by, created_at, status")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .range(from, to);
    return { rows: fb.data ?? [], total: fb.count ?? 0 };
  }

  return { rows: data ?? [], total: count ?? 0 };
}
