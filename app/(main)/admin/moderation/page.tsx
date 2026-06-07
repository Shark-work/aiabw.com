import { redirect } from "next/navigation";
import { AdminModerationPanel } from "@/components/admin/AdminModerationPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export default async function AdminModerationPage() {
  const auth = await requireAdminPage();
  if ("redirect" in auth) redirect(auth.redirect);

  const admin = createSupabaseAdminClient();

  const [pendingRes, rejectedRes] = await Promise.all([
    admin
      .from("agents")
      .select("id, slug, name, description, created_at, status, moderation_status")
      .or("moderation_status.eq.pending,status.eq.draft")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("agents")
      .select("id, slug, name, description, created_at, status, moderation_status, moderation_note")
      .eq("moderation_status", "rejected")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const pending = pendingRes.error
    ? (await admin.from("agents").select("id, slug, name, description, created_at, status").eq("status", "draft").limit(50)).data ?? []
    : pendingRes.data ?? [];

  const rejected = rejectedRes.error
    ? (await admin.from("agents").select("id, slug, name, description, created_at, status").eq("status", "archived").limit(50)).data ?? []
    : rejectedRes.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="内容审核" description="待审核 Agent、通过/拒绝与违规历史。" />
      <AdminModerationPanel pending={pending} rejected={rejected} />
    </div>
  );
}
