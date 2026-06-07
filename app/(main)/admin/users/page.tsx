import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { requireAdminPage } from "@/lib/admin-auth";
import { fetchAdminUsers } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parsePageParam } from "@/lib/pagination";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; role?: string; sub?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const query = { q: sp.q, role: sp.role, sub: sp.sub };

  const admin = createSupabaseAdminClient();
  const { rows, total } = await fetchAdminUsers(admin, { page, ...query });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="用户管理" description="搜索、筛选用户，管理角色、订阅与账号状态。" />
      <Suspense fallback={<div className="text-slate-400">加载中…</div>}>
        <AdminUsersPanel initialRows={rows} total={total} page={page} query={query} />
      </Suspense>
    </div>
  );
}
