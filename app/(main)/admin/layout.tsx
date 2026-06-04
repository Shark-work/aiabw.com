import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const adminLinks = [
  { href: "/admin", label: "后台首页" },
  { href: "/admin/settings", label: "站点配置" },
  { href: "/admin/plans", label: "套餐管理" },
  { href: "/admin/transactions", label: "交易管理" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if ((profile?.role ?? "user") !== "admin") redirect("/account");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl px-4 py-2 text-sm text-slate-200 transition hover:bg-red-400/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
