import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasDeepSeekKey: Boolean(process.env.DEEPSEEK_API_KEY),
      hasQwenKey: Boolean(process.env.QWEN_API_KEY),
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? null,
    },
    runtime: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
    },
  });
}
