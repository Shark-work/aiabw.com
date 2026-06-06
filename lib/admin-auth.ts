import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function requireAdminApi() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Unauthorized", stage: "auth", hint: "No Supabase session found." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name, username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Profile lookup failed",
          stage: "db",
          hint: profileError.message,
        },
        { status: 500 }
      ),
    };
  }

  if ((profile?.role ?? "user") !== "admin") {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Forbidden",
          stage: "rbac",
          hint: "User exists but is not marked as admin in profiles.role.",
        },
        { status: 403 }
      ),
    };
  }

  return { user, profile };
}

export type AdminPageResult =
  | { redirect: "/auth/login" | "/account" }
  | { user: { id: string; email?: string | null }; profile: { role: string } | null };

export async function requireAdminPage(): Promise<AdminPageResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { redirect: "/auth/login" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if ((profile?.role ?? "user") !== "admin") {
    return { redirect: "/account" };
  }

  return { user: { id: user.id, email: user.email }, profile };
}
