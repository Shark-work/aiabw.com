import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminToaster } from "@/components/admin/AdminToaster";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Admin 路由诊断已启用</div>
            <div className="text-cyan-50/80">
              如果后台显示异常，请先打开 <Link href="/admin/health" className="underline">/admin/health</Link> 判断是路由、鉴权还是 API 问题。
            </div>
          </div>
          <Link href="/admin/health" className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950">
            打开诊断页
          </Link>
        </div>
      </div>
      <AdminToaster />
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
