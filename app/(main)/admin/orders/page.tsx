import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminOrders } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parsePageParam } from "@/lib/pagination";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const query = { q: sp.q, status: sp.status };

  const admin = createSupabaseAdminClient();
  const { rows, total } = await fetchAdminOrders(admin, { page, ...query });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="订单管理" description="全站交易订单、支付状态与手动补单。" />
      <Suspense fallback={<div className="text-slate-400">加载中…</div>}>
        <AdminOrdersPanel initialRows={rows} total={total} page={page} query={query} />
      </Suspense>
    </div>
  );
}
