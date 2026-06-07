import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminAgentsPanel } from "@/components/admin/AdminAgentsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminAgents } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parsePageParam } from "@/lib/pagination";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
};

export default async function AdminAgentsPage({ searchParams }: PageProps) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const query = { q: sp.q, status: sp.status };

  const admin = createSupabaseAdminClient();
  const { rows, total } = await fetchAdminAgents(admin, { page, ...query });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Agent 管理" description="审核、上下架、推荐与批量运营。" />
      <Suspense fallback={<div className="text-slate-400">加载中…</div>}>
        <AdminAgentsPanel initialRows={rows} total={total} page={page} query={query} />
      </Suspense>
    </div>
  );
}
