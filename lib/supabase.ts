export { createSupabaseBrowserClient } from "@/lib/supabase-browser";
export { createSupabaseServerClient } from "@/lib/supabase-server";

// Backward-compatible entry point.
// Prefer importing from:
// - `@/lib/supabase-browser` in Client Components
// - `@/lib/supabase-server` in Server Components
