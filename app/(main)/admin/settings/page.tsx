import { redirect } from "next/navigation";
import { AdminOpsSettingsPanel } from "@/components/admin/AdminOpsSettingsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminSettingsPage() {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="系统设置"
        description="站点配置、套餐价格、佣金比例、试用次数、邮件模板与密钥状态。"
      />
      <AdminOpsSettingsPanel />
    </div>
  );
}
