import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSubscriptionsPanel } from "@/components/admin/AdminSubscriptionsPanel";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminSubscriptions } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parsePageParam } from "@/lib/pagination";

type PageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const admin = createSupabaseAdminClient();
  const { rows, total } = await fetchAdminSubscriptions(admin, { page, status: sp.status });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="订阅管理" description="Pro 订阅状态、延期与取消。" />
      <Suspense fallback={<div className="text-slate-400">加载中…</div>}>
        <AdminSubscriptionsPanel initialRows={rows} total={total} page={page} />
      </Suspense>
    </div>
  );
}
