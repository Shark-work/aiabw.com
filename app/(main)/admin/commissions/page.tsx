import { redirect } from "next/navigation";
import { AdminCommissionsPanel } from "@/components/admin/AdminCommissionsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminWithdrawals } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parsePageParam } from "@/lib/pagination";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminCommissionsPage({ searchParams }: PageProps) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const admin = createSupabaseAdminClient();

  const [cw, rw] = await Promise.all([
    admin.from("creator_wallets").select("available_usd, total_earned_usd, total_withdrawn_usd"),
    admin.from("referral_wallets").select("available_usd, total_earned_usd, total_withdrawn_usd"),
  ]);

  const sum = (rows: { available_usd?: number; total_earned_usd?: number; total_withdrawn_usd?: number }[] | null) => ({
    available: (rows ?? []).reduce((s, r) => s + Number(r.available_usd ?? 0), 0),
    earned: (rows ?? []).reduce((s, r) => s + Number(r.total_earned_usd ?? 0), 0),
    withdrawn: (rows ?? []).reduce((s, r) => s + Number(r.total_withdrawn_usd ?? 0), 0),
  });

  const { rows } = await fetchAdminWithdrawals(admin, { page });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="佣金与提现" description="创作者收益、邀请佣金与提现审核。" />
      <AdminCommissionsPanel summary={{ creator: sum(cw.data), referral: sum(rw.data) }} withdrawals={rows} />
    </div>
  );
}
